import { useRouter } from 'expo-router';
import { type ReactElement } from 'react';

import { AdminGuard } from '@/components/admin/admin-guard';
import { MovieForm } from '@/components/admin/movie-form';
import { createMovie, type MovieInput } from '@/services/admin-movies';

export default function NewMovieScreen(): ReactElement {
  return (
    <AdminGuard>
      <New />
    </AdminGuard>
  );
}

function New(): ReactElement {
  const router = useRouter();

  async function handleSubmit(input: MovieInput): Promise<void> {
    await createMovie(input);
    // Modal dismisses; the list screen's useFocusEffect will refetch and surface the new movie.
    router.back();
  }

  return (
    <MovieForm
      submitLabel="Create Movie"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}

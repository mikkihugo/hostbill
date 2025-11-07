import { Head } from '$fresh/runtime.ts';

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div class="text-center">
              <h1 class="text-6xl font-bold text-gray-300">404</h1>
              <h2 class="mt-4 text-xl font-medium text-gray-900">Page not found</h2>
              <p class="mt-2 text-sm text-gray-600">The page you're looking for doesn't exist.</p>
              <div class="mt-6">
                <a
                  href="/"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go back home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

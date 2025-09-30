import { useState, ChangeEvent, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { newsApi } from '../../lib/api'

interface NewsItem {
  id: number
  title: string
  content: string
  is_featured?: boolean
  published_at?: string
  created_at?: string
}

interface PaginatedNews {
  items: NewsItem[]
  pagination: {
    current: number
    totalPages: number
    totalRecords: number
  }
}

interface NewsFormState {
  title: string
  content: string
  excerpt: string
  image_url: string
  tags: string
  is_featured: boolean
}

const emptyNewsForm: NewsFormState = {
  title: '',
  content: '',
  excerpt: '',
  image_url: '',
  tags: '',
  is_featured: false,
}

const NewsAdminPage = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formState, setFormState] = useState<NewsFormState>(emptyNewsForm)

  const { data, isLoading, isError } = useQuery<PaginatedNews>(
    ['admin-news', page],
    async () => {
      const response = await newsApi.getAll({ page, limit: 10 })
      const payload = response.data?.data as
        | {
            news?: NewsItem[]
            pagination?: { current_page?: number; total_pages?: number; total_records?: number }
          }
        | undefined

      return {
        items: payload?.news ?? [],
        pagination: {
          current: payload?.pagination?.current_page ?? page,
          totalPages: payload?.pagination?.total_pages ?? 1,
          totalRecords: payload?.pagination?.total_records ?? 0,
        },
      }
    },
    { keepPreviousData: true },
  )

  const createNewsMutation = useMutation((body: Record<string, unknown>) => newsApi.create(body), {
    onSuccess: () => {
      toast.success('News article created')
      queryClient.invalidateQueries('admin-news')
      setFormState(emptyNewsForm)
    },
  })

  const updateNewsMutation = useMutation(
    ({ id, body }: { id: number; body: Record<string, unknown> }) => newsApi.update(id, body),
    {
      onSuccess: () => {
        toast.success('News article updated')
        queryClient.invalidateQueries('admin-news')
        setEditingId(null)
        setFormState(emptyNewsForm)
      },
    },
  )

  const deleteNewsMutation = useMutation((id: number) => newsApi.remove(id), {
    onSuccess: () => {
      toast.success('News article deleted')
      queryClient.invalidateQueries('admin-news')
    },
  })

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type, checked } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id)
    setFormState({
      title: item.title,
      content: item.content,
      excerpt: '',
      image_url: '',
      tags: '',
      is_featured: Boolean(item.is_featured),
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormState(emptyNewsForm)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this news article?')) {
      deleteNewsMutation.mutate(id)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.title || !formState.content) {
      toast.error('Title and content are required')
      return
    }

    const payload: Record<string, unknown> = {
      title: formState.title,
      content: formState.content,
      excerpt: formState.excerpt || undefined,
      image_url: formState.image_url || undefined,
      tags:
        formState.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean) || undefined,
      is_featured: formState.is_featured,
    }

    try {
      if (editingId) {
        await updateNewsMutation.mutateAsync({ id: editingId, body: payload })
      } else {
        await createNewsMutation.mutateAsync(payload)
      }
    } catch (error) {
      toast.error('Unable to save the article. Please try again.')
    }
  }

  const isBusy =
    createNewsMutation.isLoading || updateNewsMutation.isLoading || deleteNewsMutation.isLoading

  const items = data?.items ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage news</h2>
          <p className="text-sm text-gray-500">
            Publish announcements and travel updates. Featured articles appear on the homepage.
          </p>
        </div>
        {editingId && (
          <button
            onClick={handleCancelEdit}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel editing
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <label className="text-sm font-medium text-gray-700">
          Title
          <input
            name="title"
            value={formState.title}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            required
          />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Content
          <textarea
            name="content"
            value={formState.content}
            onChange={handleChange}
            rows={6}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Excerpt
            <input
              name="excerpt"
              value={formState.excerpt}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="Optional summary"
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Image URL
            <input
              name="image_url"
              value={formState.image_url}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Tags (comma separated)
            <input
              name="tags"
              value={formState.tags}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </label>
          <label className="mt-7 flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="is_featured"
              checked={formState.is_featured}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            Featured article
          </label>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? 'Update article' : 'Create article'}
          </button>
        </div>
      </form>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Published articles</h3>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <EmptyState title="Unable to load news" description="Please try again later." />
        ) : items.length === 0 ? (
          <EmptyState title="No articles yet" description="Create your first article." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Featured</th>
                  <th className="px-4 py-3 text-left">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">{item.title}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {item.is_featured ? (
                        <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-600">Yes</span>
                      ) : (
                        'No'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {item.published_at
                        ? new Date(item.published_at).toLocaleString()
                        : 'Draft'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {pagination.current} of {pagination.totalPages}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default NewsAdminPage


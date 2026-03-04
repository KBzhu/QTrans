import { http } from 'msw'
import { getDemoState } from '../data/demo-init'
import { mockDelay, success } from './_utils'

export const cityHandlers = [
  http.get('/api/cities/list', async () => {
    await mockDelay(150)
    const state = getDemoState()
    return success(state.cities)
  }),

  http.get('/api/cities/search', async ({ request }) => {
    await mockDelay(120)

    const state = getDemoState()
    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') || '').trim().toLowerCase()

    const list = state.cities.flatMap(country => country.cities.map(city => ({
      country: country.country,
      countryCode: country.countryCode,
      ...city,
    })))

    const result = keyword
      ? list.filter(item => item.name.toLowerCase().includes(keyword) || item.country.toLowerCase().includes(keyword))
      : list

    return success(result)
  }),
]

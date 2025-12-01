import { supabase } from '../lib/supabase'

export async function generateNarrative(routeId: string): Promise<{ narrative: string }> {
  const { data: route } = await supabase
    .from('routes')
    .select('*')
    .eq('id', routeId)
    .single()

  const { data: stops } = await supabase
    .from('stops')
    .select('*')
    .eq('route_id', routeId)
    .order('sequence', { ascending: true })

  const placeholderNarrative = `
# ${route.title}

## The Journey

On ${new Date(route.started_at).toLocaleDateString()}, I embarked on an unforgettable culinary adventure through the city.
The journey covered ${(route.total_distance / 1000).toFixed(2)}km over ${Math.floor(route.total_duration / 3600)} hours and ${Math.floor((route.total_duration % 3600) / 60)} minutes.

## The Stops

${stops?.map((stop, idx) => `
### ${idx + 1}. ${stop.place_name}
${stop.notes || 'A memorable stop on this food journey.'}
${stop.rating ? `Rating: ${'⭐'.repeat(stop.rating)}` : ''}
`).join('\n') || 'No stops recorded.'}

## Conclusion

This food journey was a wonderful exploration of local flavors and hidden gems. Each stop contributed to an unforgettable experience.

---

_TODO: Integrate with Gemini AI API to generate personalized narratives based on route data, stop descriptions, and uploaded photos._
_See: https://ai.google.dev/gemini-api/docs_
`.trim()

  await supabase
    .from('routes')
    .update({ ai_narrative: placeholderNarrative })
    .eq('id', routeId)

  return { narrative: placeholderNarrative }
}

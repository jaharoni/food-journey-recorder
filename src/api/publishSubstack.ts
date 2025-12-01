import { supabase } from '../lib/supabase'

export async function publishToSubstack(routeId: string): Promise<{ substackUrl: string }> {
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

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${route.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; }
    .stop { margin: 30px 0; padding: 20px; border-left: 4px solid #22c55e; background: #f9fafb; }
    .stop h3 { margin-top: 0; }
    .rating { color: #fbbf24; }
    .link { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <h1>${route.title}</h1>

  ${route.ai_narrative ? `<div>${route.ai_narrative.replace(/\n/g, '<br>')}</div>` : ''}

  <h2>Route Details</h2>
  <p><strong>Distance:</strong> ${(route.total_distance / 1000).toFixed(2)}km</p>
  <p><strong>Duration:</strong> ${Math.floor(route.total_duration / 3600)}h ${Math.floor((route.total_duration % 3600) / 60)}m</p>

  <h2>Stops</h2>
  ${stops?.map((stop, idx) => `
    <div class="stop">
      <h3>${idx + 1}. ${stop.place_name}</h3>
      ${stop.notes ? `<p>${stop.notes}</p>` : ''}
      ${stop.rating ? `<p class="rating">${'⭐'.repeat(stop.rating)}</p>` : ''}
    </div>
  `).join('') || '<p>No stops recorded.</p>'}

  <hr>
  <p><a href="${window.location.origin}/routes/${routeId}/view" class="link">→ Watch the Animated Route Playback</a></p>

  <p><em>TODO: Integrate with Substack API to automatically publish posts.</em></p>
  <p><em>See: Substack allows email-based publishing or API access for programmatic publishing.</em></p>
  <p><em>For now, copy this HTML and manually create a Substack post.</em></p>
</body>
</html>
`.trim()

  const fakeSubstackUrl = `https://yoursubstack.substack.com/p/${route.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

  await supabase
    .from('routes')
    .update({ substack_url: fakeSubstackUrl })
    .eq('id', routeId)

  console.log('Generated Substack HTML:', htmlContent)

  return { substackUrl: fakeSubstackUrl }
}

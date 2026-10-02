import { ACCESS_LABELS } from '../lib/saunaQuality';
export default function AccessDetails({ sauna }) {
  if (!sauna.access_policy || sauna.access_policy === 'unknown') return null;
  return <div className="my-3 border-l-2 border-terracotta pl-3">
    <p className="text-xs font-medium">{ACCESS_LABELS[sauna.access_policy]}</p>
    {sauna.access_notes && <p className="text-xs text-warm-gray mt-1">{sauna.access_notes}</p>}
    {sauna.access_source_url && <a href={sauna.access_source_url} target="_blank" rel="noopener noreferrer"
      onClick={event=>event.stopPropagation()} className="text-xs underline text-warm-gray">Access details ↗</a>}
  </div>;
}

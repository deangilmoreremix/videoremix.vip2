import { useSearchParams } from 'react-router-dom';
import PersonalizerDialog from '../components/personalizer/PersonalizerDialog';

export default function PersonalizerPage() {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('app') || undefined;
  const mode = searchParams.get('mode') || undefined;
  const initialTarget = searchParams.get('target') || undefined;

  return (
    <PersonalizerDialog
      open={true}
      onClose={() => window.history.back()}
      appId={appId}
      mode={mode}
      initialTarget={initialTarget}
    />
  );
}
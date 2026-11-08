import { ActivationSparkline } from '@/components/charts/ActivationSparkline/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter/TokenHighlighter';

export function SideBySide() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <ActivationSparkline data={[0.3, 0.7]} maxActivation={1} width={150} height={32} />
        <TokenHighlighter tokens={["side", "by"]} activations={[0.6, 0.3]} maxTokens={2} maxActivation={1} />
      </div>
      <div>
        <ActivationSparkline data={[0.5, 0.2]} maxActivation={1} width={150} height={32} />
        <TokenHighlighter tokens={["side"]} activations={[0.8]} maxTokens={1} maxActivation={1} />
      </div>
    </div>
  );
}
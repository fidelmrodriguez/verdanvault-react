export type CelebrationTier = 'normal' | 'big' | 'grand';

type WinCelebrationProps = {
  tier: CelebrationTier;
  label: string;
  animatedWin: number;
};

const credits = (value: number) => value.toLocaleString('pt-BR');

export function WinCelebration({ tier, label, animatedWin }: WinCelebrationProps) {
  return (
    <div className={`win-celebration celebration-${tier}`} aria-live="polite">
      <div className="coin-rain" aria-hidden="true">
        {Array.from({ length: tier === 'grand' ? 34 : tier === 'big' ? 24 : 16 }, (_, index) => (
          <i key={index} className={`coin coin-${(index % 16) + 1} coin-extra-${index + 1}`} />
        ))}
      </div>
      {(tier === 'big' || tier === 'grand') && (
        <div className="big-win-effects" aria-hidden="true">
          <i className="shockwave shockwave-1" />
          <i className="shockwave shockwave-2" />
          {Array.from({ length: tier === 'grand' ? 22 : 12 }, (_, index) => (
            <i key={index} className={`spark spark-${(index % 12) + 1}`} />
          ))}
        </div>
      )}
      {tier === 'grand' && (
        <div className="grand-win-effects" aria-hidden="true">
          <i className="grand-flash" />
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} className={`relic-shard shard-${(index % 9) + 1}`} />
          ))}
          <i className="grand-ring grand-ring-1" />
          <i className="grand-ring grand-ring-2" />
          <i className="grand-ring grand-ring-3" />
        </div>
      )}
      <div className="win-plaque">
        <span>{label}</span>
        <strong>+{credits(animatedWin)}</strong>
        <small>CRÉDITOS</small>
      </div>
    </div>
  );
}

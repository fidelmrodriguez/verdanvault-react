import { LOADING_ART } from '../content/hero';

type LoadingScreenProps = {
  progress: number;
  leaving: boolean;
};

export function LoadingScreen({ progress, leaving }: LoadingScreenProps) {
  return (
    <div
      className={`loading-screen ${leaving ? 'is-leaving' : ''}`}
      aria-label="Carregando Verdant Vault"
    >
      <img className="loading-screen-art" src={LOADING_ART} alt="" />
      <div className="loading-screen-shade" />
      <div className="loading-screen-content">
        <span className="loading-kicker">THE LOST TEMPLE</span>
        <strong>VERDANT VAULT</strong>
        <div
          className="loading-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
        <small>{progress}% · preparando a expedição</small>
      </div>
    </div>
  );
}

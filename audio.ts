import {
  HERO_BACKGROUND,
  HERO_MASCOTS,
  type HeroMascotState,
  type HeroStory,
  type HeroStoryState,
} from '../content/hero';

type HeroSceneProps = {
  mascot: HeroMascotState;
  busy: boolean;
  celebrating: boolean;
  resultId?: string;
  story: HeroStory;
  storyState: HeroStoryState;
  storyIndex: number;
  mobileStoryVisible: boolean;
};

export function HeroScene({
  mascot,
  busy,
  celebrating,
  resultId,
  story,
  storyState,
  storyIndex,
  mobileStoryVisible,
}: HeroSceneProps) {
  return (
    <div
      className={`hero-scene hero-state-${mascot} ${busy ? 'is-busy' : ''} ${celebrating ? 'is-celebrating' : ''}`}
      aria-hidden="true"
    >
      <img className="hero-background-image" src={HERO_BACKGROUND} alt="" fetchPriority="high" />
      <div className="hero-vignette" />
      <div className="hero-panel">
        <div className="hero-brand-copy">
          <div className="hero-brand-rule" />
          <span>THE LOST TEMPLE</span>
          <h2>
            VERDANT
            <br />
            <em>VAULT</em>
          </h2>
          <div className="hero-brand-sub">
            <i />
            UM NOVO CAMINHO A CADA GIRO
            <i />
          </div>
        </div>
        <div className={`hero-mascot-shell mascot-${mascot}`}>
          <div className="hero-mascot-glow" />
          <img
            key={`${resultId ?? 'idle'}-${mascot}`}
            className="hero-mascot"
            src={HERO_MASCOTS[mascot]}
            alt=""
            fetchPriority="high"
          />
        </div>
        <div className="hero-story" key={`desktop-${storyState}-${storyIndex}`}>
          <span className="story-kicker">{story.kicker}</span>
          <strong>{story.headline}</strong>
          <small>{story.body}</small>
        </div>
        <div
          className={`hero-mobile-toast ${mobileStoryVisible ? 'is-visible' : ''}`}
          key={`mobile-${storyState}-${storyIndex}`}
        >
          <span>{story.kicker}</span>
          <strong>{story.headline}</strong>
        </div>
      </div>
      {celebrating && (
        <div className="hero-win-burst">
          <span className="burst-ring" />
          <span className="burst-ray ray-1" />
          <span className="burst-ray ray-2" />
          <span className="burst-ray ray-3" />
        </div>
      )}
    </div>
  );
}

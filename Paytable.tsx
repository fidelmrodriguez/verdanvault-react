import { Leaf, Menu, X } from 'lucide-react';

type GameHeaderProps = {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
};

export function GameHeader({
  mobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onOpenRules,
  onOpenSettings,
}: GameHeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="Verdant Vault, início">
        <div className="brand-icon">
          <Leaf size={24} />
        </div>
        <span>
          VERDANT<span className="brand-light"> VAULT</span>
          <small>THE LOST TEMPLE</small>
        </span>
      </a>
      <nav className="desktop-nav" aria-label="Navegação principal">
        <a className="nav-active" href="#game">
          O jogo
        </a>
        <button onClick={onOpenRules}>Como jogar</button>
        <button onClick={onOpenSettings}>Preferências</button>
      </nav>
      <div className="header-status">
        <span className="status-dot" />
        EXPEDIÇÃO ATIVA<span className="status-badge">TEMPLO 01</span>
      </div>
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation"
        onClick={onToggleMobileMenu}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav
        id="mobile-navigation"
        className={`mobile-navigation ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-label="Navegação móvel"
      >
        <a href="#game" onClick={onCloseMobileMenu}>
          O jogo
        </a>
        <button
          type="button"
          onClick={() => {
            onCloseMobileMenu();
            onOpenRules();
          }}
        >
          Como jogar
        </button>
        <button
          type="button"
          onClick={() => {
            onCloseMobileMenu();
            onOpenSettings();
          }}
        >
          Preferências
        </button>
      </nav>
    </header>
  );
}

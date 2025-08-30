import React from 'react';

const SidebarFooter: React.FC = () => {
  return (
    <footer className="sidebar-footer">
      <div className="disclaimer">
        <strong>Disclaimer:</strong> All data on this site is not verified and should not be used
        for any purchasing decisions.
      </div>
      <div className="copyright">&copy; Andrew Carpenter, 2025</div>
      <div className="footer-links">
        <a href="https://bsky.app/profile/ajcarpenter.com" target="_blank" rel="noopener">
          Bluesky
        </a>
        <a href="https://github.com/ajcarpenter/doesmybootfit" target="_blank" rel="noopener">
          GitHub
        </a>
      </div>
    </footer>
  );
};

export default SidebarFooter;

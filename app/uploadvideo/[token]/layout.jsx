export const metadata = {
  title: "Add your video — MyLyfe",
  description: "Put a piece of your life on the MyLyfe homepage.",
  // A capability URL must never end up in a search index — the token in the
  // path IS the credential.
  robots: { index: false, follow: false },
};

const Layout = ({ children }) => children;

export default Layout;

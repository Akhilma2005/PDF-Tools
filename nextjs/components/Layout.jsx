import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, hideFooter = false }) {
  return (
    <>
      <Header />
      {children}
      {!hideFooter && <Footer />}
    </>
  );
}

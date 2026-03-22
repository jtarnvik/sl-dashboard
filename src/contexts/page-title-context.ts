import { createContext } from 'react';

const PageTitleContext = createContext({
  heading: '',
  setHeading: (_: string) => {},
});

export default PageTitleContext;

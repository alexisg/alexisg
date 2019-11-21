import React, { Fragment } from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

`

const alexisTheme = {
  primary: "blue",
}

const Provider = ({ children }) => (
  <ThemeProvider theme={alexisTheme}>
    <GlobalStyles />
    <Fragment>
      {children}
    </Fragment>  
  </ThemeProvider>
)

export default Provider

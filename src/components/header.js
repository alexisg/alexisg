import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"

import Image from "./image"
import "./header.css"

const Header = ({ siteTitle }) => (
  <header className="header">

    <Link
      to="/"
    >
      <div className="portrait transition">
        <div className="portrait__img">
          <Image />
        </div>
        <span className="portrait__icon icon icon--andre"></span>
      </div>
      <h1 className="header__logo align-center">
        {siteTitle}
      </h1>
    </Link>

  </header>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header

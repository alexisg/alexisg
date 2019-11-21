import React from "react"
import { Link } from "gatsby"
import ProfileImage from "../images/pic216.jpg"
import "./header.css"

const Header = ({ siteTitle }) => (
  <header className="header">

    <Link
      to="/"
    >
      <div className="portrait transition">
        <div className="portrait__img">
          <img src={ProfileImage} alt="" />
        </div>
        <span className="portrait__icon icon icon--andre"></span>
      </div>
      <h1 className="header__logo align-center">
        Alexis Gallis&aacute;
      </h1>
    </Link>

  </header>
)

export default Header

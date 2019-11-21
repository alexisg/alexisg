import React from "react"
import { Link } from "gatsby"
import ProfileImage from "../images/pic216.jpg"
import AndreImage from "../images/icon-andre@2x.png"
import styled from "styled-components"

const Portrait = styled.div({
  width: "9rem",
  height: "9rem",
  position: "relative" ,
  margin: "0 auto",
})

const PortraitImage = styled.img({
  width: "9rem",
  height: "9rem",
  borderRadius: "50%",
  display: "block" 
})

const PortraitIcon = styled.div({
  background: `url(${AndreImage}) top right no-repeat`,
  backgroundSize: "24px auto",
  position: "absolute",
  bottom: "-8px",
  right: "4px",
  width: "24px",
  height: "46px",
  ":hover" : {
    backgroundPosition: "0 -70px",
  }
})

const Header = ({ siteTitle }) => (
  <header>

    <Link
      to="/"
    >
      <Portrait>
        <PortraitImage src={ProfileImage} alt="" />
        <PortraitIcon />
      </Portrait>
      <h1>
        Alexis Gallis&aacute;
      </h1>
    </Link>

  </header>
)

export default Header

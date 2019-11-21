import React, { useState } from "react"
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

const PortraitIcon = styled.div(({ isHovered }) => ({
  background: `url(${AndreImage}) no-repeat`,
  backgroundPosition: isHovered ? "0 -70px" : "right top",
  backgroundSize: "24px auto",
  position: "absolute",
  bottom: "-8px",
  right: "4px",
  width: "24px",
  height: "46px",
}))

const PortraitState = () => {

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to="/"
      onMouseOver={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Portrait>
        <PortraitImage src={ProfileImage} alt=" " />
        <PortraitIcon isHovered={isHovered} />
      </Portrait>
      <h1>
        Alexis Gallis&aacute;
      </h1>
    </Link>
  )
}

const Header = ({ siteTitle }) => (
  <header>
    <PortraitState />
  </header>
)

export default Header

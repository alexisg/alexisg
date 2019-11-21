/* eslint-disable jsx-a11y/media-has-caption */
import React from "react"
import Layout from "../components/layout"
import SEO from "../components/seo"

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <section className="transition transition--fadein">
      <p>
        I am a Sr. Design Director at <a href="https://twitch.tv">Twitch.tv</a>.
        I lead the Consumer Product Design org responsible for our react-first
        Design System, and product experience across our viewer and creator
        apps. I believe in inclusive design driven by collaborative and
        empowering systems. Previously I was the Creative Technical Director at
        CBSi Games, where I led the redesigns of{" "}
        <a href="portfolio/gamespot/">GameSpot</a> and{" "}
        <a href="portfolio/giant-bomb/">Giant Bomb</a>.
      </p>

      <h2 className="font-size-4">Twitch Rebrand</h2>
      <p>
        In 2019, the brand and product design teams at Twitch worked with our
        friends over at Collins to re-imagine our brand. The Twitch you see
        today is the culmination of this amazing work. You can read more about
        this incredible transformation on the
        <a
          href="https://blog.twitch.tv/en/2019/09/26/nice-to-meet-you-again-for-the-first-time/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Twitch blog
        </a>{" "}
        and at{" "}
        <a
          href="https://www.wearecollins.com/work/twitch/"
          target="_blank"
          rel="noopener noreferrer"
        >
          We Are Collins
        </a>
        .
      </p>

      <div
        className="js-media-hold nav-portfolio__media shadow aspect mg-b-2"
        data-video="/static/media/twitch-uv.mp4"
        data-img="/static/media/twitch-uv.jpg"
        data-title="Twitch"
        data-id="Twitch"
      >
        <video id="Twitch" playsInline muted autoPlay loop width="100%">
          <source
            src="//www.alexisgallisa.com/static/media/twitch-uv.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      <h2 className="font-size-4">Previous Work</h2>
    </section>
  </Layout>
)

export default IndexPage

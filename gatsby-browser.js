import React from "react"
import PropTypes from "prop-types"
import Provider from "./src/provider"

const wrapRootElement = ({ element }) => <Provider>{element}</Provider>

wrapRootElement.propTypes = {
  element: PropTypes.node.isRequired,
}

export default wrapRootElement

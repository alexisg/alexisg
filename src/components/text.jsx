import React from "react"
import PropTypes from "prop-types"

const Text = ({ string }) => <h1>{string}</h1>

Text.propTypes = {
  string: PropTypes.string.isRequired,
}

export default Text

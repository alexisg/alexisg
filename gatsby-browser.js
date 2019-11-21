import React from "react"
import Provider from "./src/provider"

const wrapRootElement = ({ element }) => <Provider>{element}</Provider>

export default wrapRootElement

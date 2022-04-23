import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import Spacer from "./Spacer";

type HeadingProps = {
  fullSize: boolean;
};

const Heading = ({ fullSize }: HeadingProps) => (
  <div className="heading">
    <Link to="/">
      <h2 className="text-secondary">blymp.io</h2>
    </Link>
    {fullSize && (
      <>
        <h1 className="text-primary">
          <span className="underline">No bullsh*t file transfer</span>
        </h1>
      </>
    )}

    <Spacer size="3rem" />
  </div>
);

Heading.propTypes = {
  fullSize: PropTypes.bool,
};

Heading.defaultProps = {
  fullSize: false,
};

export default Heading;

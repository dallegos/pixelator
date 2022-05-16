import PropTypes from "prop-types";

import "./styles.scss";

type Props = {
  text: string;
  className: string;
  onClick?: any;
};

const Button = ({ text, className, onClick }: Props) => {
  return (
    <button
      className={className}
      onClick={() => {
        if (onClick) {
          onClick();
        }
      }}
    >
      {text}
    </button>
  );
};

Button.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default Button;

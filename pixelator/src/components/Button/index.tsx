import PropTypes from "prop-types";

import "./styles.scss";

type Props = {
  text: string;
  className?: string;
  onClick?: any;
};

const Button = ({ text, className, onClick }: Props) => {
  return (
    <button
      className={`button ${className}`}
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
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Button;

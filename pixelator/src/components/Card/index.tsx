import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FileType } from "../../pages/Inicio";

import "./styles.scss";

type Props = { file: FileType; folder: string; index?: number };

const Card = ({ file, folder }: Props) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        navigate(`/${folder}/${file.name}`);
      }}
      className="card"
    >
      <img
        alt={`${file.name}`}
        src={`${process.env.PUBLIC_URL}/img/${file.img}`}
      />
    </div>
  );
};

Card.propTypes = {
  image: PropTypes.string,
  folder: PropTypes.string,
  index: PropTypes.number,
};

export default Card;

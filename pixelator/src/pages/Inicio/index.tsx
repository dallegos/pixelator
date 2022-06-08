import { useEffect, useMemo } from "react";
import filesStructure from "../../filesStructure.js";

import "./styles.scss";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useNavigate, useParams } from "react-router-dom";

type FolderType = {
  name: string;
  files: FileType[];
};

export type FileType = {
  name: string;
  img: string;
  css: string;
};

const Inicio = () => {
  const { folder } = useParams<string>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!folder) return;

    const index = filesStructure.findIndex(
      (innerFolder: FolderType): boolean => innerFolder.name === folder
    );

    if (index === -1) {
      navigate("/404", { replace: true });
    }
  }, [navigate, folder]);

  const buttons = useMemo(() => {
    const ButtonsList = filesStructure.map((folder: FolderType, i: number) => (
      <Button
        text={folder.name}
        key={`button-${i}`}
        onClick={() => {
          navigate(`/${folder.name}`);
        }}
      />
    ));

    return ButtonsList;
  }, [navigate]);

  const cards = useMemo(() => {
    const index = filesStructure.findIndex(
      (innerFolder) => innerFolder.name === folder
    );

    if (index === undefined || index === -1) {
      return <h1>Selecciona una carpeta para comenzar.</h1>;
    }

    const directory = filesStructure[index];

    const cardsList = directory.files.map((file, i) => (
      <Card key={`card-${i}`} file={file} folder={directory.name} />
    ));

    return cardsList;
  }, [folder]);

  return (
    <>
      <div className="homeContainer">
        <div className="buttonsContainer">{buttons}</div>
        <div className="grid">{cards}</div>
      </div>
    </>
  );
};

export default Inicio;

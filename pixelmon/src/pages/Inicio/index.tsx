import { useEffect, useMemo, useState } from "react";
import pokemonList from "../../pokemonList";
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

  const buttons = useMemo(() => {
    const ButtonsList = filesStructure.map((folder: FolderType, i: number) => (
      <Button
        text={folder.name}
        key={i}
        onClick={() => {
          navigate(`/${folder.name}`);
        }}
      />
    ));

    return ButtonsList;
  }, []);

  const cards = useMemo(() => {
    const index = filesStructure.findIndex(
      (innerFolder) => innerFolder.name === folder
    );

    if (index === -1) {
      return <></>;
    }

    const directory = filesStructure[index];

    const cardsList = directory.files.map((file, i) => (
      <Card key={i} file={file} folder={directory.name} index={i} />
    ));

    return cardsList;
  }, []);

  return (
    <>
      <div className="homeContainer">
        <div className="buttonsContainer">{buttons}</div>
        <div className="grid">{!pokemonList.length ? null : cards}</div>
      </div>
    </>
  );
};

export default Inicio;

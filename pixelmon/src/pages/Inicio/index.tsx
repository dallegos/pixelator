import { useMemo } from "react";
import pokemonList from "../../pokemonList";

import "./styles.scss";
import Card from "../../components/Card";

const Inicio = () => {
  const cards = useMemo(() => {
    const cardsList = pokemonList.map((pokemon, i) => (
      <Card key={i} pokemon={pokemon} index={i} />
    ));

    return cardsList;
  }, []);

  return (
    <>
      <div className="homeContainer">
        <div className="grid">{!pokemonList.length ? null : cards}</div>
      </div>
    </>
  );
};

export default Inicio;

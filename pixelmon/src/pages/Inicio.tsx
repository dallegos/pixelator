import { useMemo } from "react";
import Card from "../components/Card";
import pokemonList from "../pokemonList";

const Inicio = () => {
  const cards = useMemo(() => {
    const cardsList = pokemonList.map((pokemon, i) => (
      <Card key={i} pokemon={pokemon} index={i} />
    ));

    return cardsList;
  }, []);

  return (
    <>
      <div className="grid">{!pokemonList.length ? null : cards}</div>
    </>
  );
};

export default Inicio;

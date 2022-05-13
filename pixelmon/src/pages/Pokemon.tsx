import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Pokemon = () => {
  const navigate = useNavigate();

  const { name } = useParams<string>();

  const [copied, setCopied] = useState<boolean>(false);
  const [completeStyles, setCompleteStyles] = useState<string>("");
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  const pokemonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      require(`../styles/pokemons/${name}.scss`);

      if (pokemonRef.current) {
        const styles = window.getComputedStyle(pokemonRef.current, "");

        let text = `
        <style>
          \t.${name} {
            \t\twidth: ${styles.width};
            \t\theight: ${styles.height};
            \t\tbox-shadow: ${styles.boxShadow};
          }
        </style>
        <div class="${name}"></div>`;

        setCompleteStyles(text);
      }
    } catch (err) {
      navigate(`/404`);
    }
  }, [name, navigate]);

  const handleClick = () => {
    clearTimeout(timer);

    setCopied(true);
    setTimer(
      setTimeout(() => {
        setCopied(false);
      }, 2000)
    );
  };

  return (
    <div className="resultContainer">
      <button
        className="button backButton"
        onClick={() => {
          navigate(-1);
        }}
      >
        ← Back to index
      </button>

      <div className="pokemonContainer">
        <div ref={pokemonRef} className={`pokemon ${name}`}></div>
      </div>

      <div className="infoContainer">
        <div className="buttonContainer">
          <CopyToClipboard text={completeStyles} onCopy={handleClick}>
            <button className="button">Copy to clipboard</button>
          </CopyToClipboard>
          {copied ? <span>✓ Copied</span> : null}
        </div>

        <textarea
          name="style"
          onChange={(e) => setCompleteStyles(e.target.value)}
          value={completeStyles}
        ></textarea>
      </div>
    </div>
  );
};

export default Pokemon;

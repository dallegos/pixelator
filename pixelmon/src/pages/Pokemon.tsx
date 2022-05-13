import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Pokemon = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [completeStyles, setCompleteStyles] = useState<string>("");

  const { name } = useParams<string>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pokemonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      require(`../styles/pokemons/${name}.scss`);

      if (pokemonRef.current && textareaRef.current) {
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
        //textareaRef.current.value = completeStyle;
      }
    } catch (err) {
      navigate(`/404`);
    }
  }, [name, navigate]);

  return (
    <div className="resultContainer">
      <div className="pokemonContainer">
        <div ref={pokemonRef} className={`pokemon ${name}`}></div>
      </div>

      <CopyToClipboard text={completeStyles} onCopy={() => setCopied(true)}>
        <button>Copy to clipboard</button>
      </CopyToClipboard>
      {copied ? <span style={{ color: "red" }}>Copied.</span> : null}

      <textarea
        name="style"
        ref={textareaRef}
        value={completeStyles}
      ></textarea>
    </div>
  );
};

export default Pokemon;

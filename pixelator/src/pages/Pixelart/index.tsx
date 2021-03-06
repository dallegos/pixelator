import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CopyToClipboard } from "react-copy-to-clipboard";

import "./styles.scss";
import "../../styles/pixelator.css";
import Button from "../../components/Button";

const Pokemon = () => {
  const navigate = useNavigate();

  const { folder, name } = useParams<string>();

  const [copied, setCopied] = useState<boolean>(false);
  //const [darkMode, setDarkMode] = useState<boolean>(false);
  const [completeStyles, setCompleteStyles] = useState<string>("");
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  const imageRef = useRef<HTMLDivElement>(null);

  const updateTextarea = useCallback(() => {
    if (imageRef.current) {
      const styles = window.getComputedStyle(imageRef.current, "");

      const text = ["<style>"];
      text.push(`  .${name} {`);
      text.push(`    width: ${styles.width};`);
      text.push(`    height: ${styles.height};`);
      text.push(`    box-shadow: ${styles.boxShadow};`);
      text.push(`  };`);
      text.push("</style>\n");
      text.push(`<div class='${name}'></div>`);

      setCompleteStyles(text.join("\n"));
    }
  }, [name]);

  useEffect(() => {
    try {
      require(`../../styles/${folder}/${name}.css`);

      updateTextarea();
    } catch (err) {
      navigate(`/404`, { replace: true });
    }

    /* console.log("folder", folder);
    console.log("name", name); */
  }, [name, folder, navigate, updateTextarea]);

  const handleClick = () => {
    clearTimeout(timer);

    setCopied(true);
    setTimer(
      setTimeout(() => {
        setCopied(false);
      }, 2000)
    );
  };

  /* const handleDarkMode = () => {
    setDarkMode(!darkMode);

    // Esperar a que el dom haga el render ?
    // por ahora timeout.
    setTimeout(() => {
      updateTextarea();
    }, 100);
  }; */

  return (
    <div className="resultContainer">
      <Button
        text="← Back to index"
        className="button backButton"
        onClick={() => {
          navigate(-1);
        }}
      />

      <div className="box">
        <div className="buttonContainer">
          {/* <button className="button" onClick={handleDarkMode}>
            {darkMode ? "Set normal mode" : "Set dark mode"}
          </button> */}
        </div>
        <div className="pixeledImageContainer">
          <div
            ref={imageRef}
            //${darkMode ? "dark" : ""}
            className={`pixeledImage ${name} `}
          ></div>
        </div>
      </div>

      <div className="box">
        <div className="buttonContainer">
          <CopyToClipboard text={completeStyles} onCopy={handleClick}>
            <Button text="Copy to clipboard" className="button" />
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

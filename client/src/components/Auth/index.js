import React, { useCallback } from "react";
import { MetaMaskButton } from "rimble-ui";
import styles from "../../Neo.module.scss";

export default function Auth(props) {
  const { web3Context } = props;
  const requestAuth = async (web3Context) => {
    console.log(web3Context);
    try {
      if (web3Context.lib) {
        await web3Context.requestAuth();
      } else {
        await web3Context.enable();
      }
      console.log(web3Context);
    } catch (e) {
      console.error(e);
    }
  };
  const requestAccess = useCallback(() => requestAuth(web3Context), []);

  return (
    <MetaMaskButton width={1} className={styles.neoBtn} onClick={requestAccess}>
      Connect
    </MetaMaskButton>
  );
}

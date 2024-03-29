import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@openzeppelin/network/react";
import { Grid, Container, Button } from "semantic-ui-react";
import ETHSlotMachine from "../../contracts/ETHSlotMachine.sol";
import Banner from "./components/Banner";
import Stats from "./components/Stats";
import Activity from "./components/Activity";
import Spinner from "./components/Spinner";
import Auth from "./components/Auth";
import EmojiRain from "./components/EmojiRain";
import styles from "./Neo.module.scss";
const infuraToken = "a8ef668930b24552a052429794c2c6d3";

function App() {
  const injected = useWeb3(`wss://rinkeby.infura.io/ws/v3/${infuraToken}`);
  const [isOwner, setIsOwner] = useState(false);
  const [balance, setBalance] = useState(0);
  const [state, setState] = useState({});
  const [logs, setLogs] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [win, setWin] = useState(-1);
  const [contract, setContract] = useState(null);

  const reels = [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [0, 1, 2, 3, 4, 7, 5, 6],
    [0, 1, 2, 3, 4, 6, 7, 5],
  ];
  const [currentReel, setCurrentReel] = useState([
    { index: 0 },
    { index: 0 },
    { index: 0 },
  ]);
  const [spinner, setSpinner] = useState(true);

  const requestAuth = async (web3Context) => {
    try {
      if (web3Context.providerName !== "infura") {
        await web3Context.requestAuth();
      }
    } catch (e) {
      console.error(e);
    }
  };
  const getAccess = useCallback(() => requestAuth(injected), []);

  const getBalance = async (web3Context) => {
    const lib = web3Context.lib;
    const accounts = web3Context.accounts;
    if (accounts) {
      let balance =
        accounts && accounts.length > 0
          ? lib.utils.fromWei(await lib.eth.getBalance(accounts[0]), "ether")
          : "Unknown";
      setBalance(balance);
    }
  };

  const refreshValues = async (instance) => {
    if (instance) {
      setState({
        ...state,
        total: await instance.methods.total().call(),
        win: await instance.methods.win().call(),
        pot: injected.lib.utils.fromWei(
          await instance.methods.pot().call(),
          "ether"
        ),
        price: injected.lib.utils.fromWei(
          await instance.methods.price().call(),
          "ether"
        ),
      });
      setWinners(await instance.methods.getAllWinners().call());
      if (injected.providerName !== "infura") {
        getBalance(injected);
        setIsOwner(
          await instance.methods.isOwner().call({ from: injected.accounts[0] })
        );
      }
    }
  };

  const loadMoney = async () => {
    setLoading(true);
    await injected.lib.eth.sendTransaction({
      from: injected.accounts[0],
      to: contract._address,
      value: injected.lib.utils.toWei(state.price),
    });
    setLoading(false);
  };

  const setNewCurrentReel = (prizeID) => {
    const rand = Math.floor(Math.random() * (8 - 5)) + 5;
    const newCurrentReel = reels.map((reel) => {
      const randNo = prizeID < 5 ? prizeID : rand;
      return {
        index: randNo,
        name: reel[randNo],
      };
    });

    setCurrentReel(newCurrentReel);
  };

  const getLucky = async () => {
    setWin(-1);
    setLoading(true);
    setSpinner(true);
    let response;
    if (contract) {
      try {
        await contract.methods
          .getLucky()
          .send({
            from: injected.accounts[0],
            value: injected.lib.utils.toWei(state.price),
          })
          .on("receipt", (receipt) => {
            response = receipt;
          });
        let log = response.events["Response"].returnValues;
        if (log[1] !== "Deposit" && log[1] !== "Lose") {
          setLogs([
            { player: log[0], message: log[1], value: log[3] },
            ...logs,
          ]);
        }
        setWin(Number(log[2]));
        setNewCurrentReel(Number(log[2]));
        setSpinner(false);
        setLoading(false);
      } catch (e) {
        //console.log(e);
        setSpinner(false);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let instance = null;
    if (injected) {
      let deployedNetwork = null;
      if (ETHSlotMachine.networks) {
        deployedNetwork = ETHSlotMachine.networks[injected.networkId];
        if (deployedNetwork) {
          instance = new injected.lib.eth.Contract(
            ETHSlotMachine.abi,
            deployedNetwork.address
              ? deployedNetwork.address
              : "0xe1949e25Db859DfC10eB2B6E440279DE0D272793"
          );
        }
      }
      setContract(instance);
      getAccess();
      getBalance(injected);
      setInterval(() => refreshValues(instance), 100);
      setTimeout(() => {
        setSpinner(false);
      }, 1000);
    }
  }, [injected, injected.accounts, injected.networkId]);

  return (
    <>
      {win > -1 && win < 5 ? (
        <EmojiRain jackpot={win === 0 ? true : false} />
      ) : null}
      <Container className={styles.neoApp}>
        <Banner balance={balance} />
        <Grid>
          {injected.networkId !== 4 ? (
            <Grid.Row
              as="h3"
              centered
              className={styles.container}
              style={{ marginBottom: "4vh" }}
            >
              Please switch to Rinkeby
            </Grid.Row>
          ) : null}
          {win > -1 && win <= 5 ? (
            <Grid.Row
              as="h3"
              centered
              className={styles.container}
              style={{ marginBottom: "4vh" }}
            >
              {win === 5
                ? "Better luck next time"
                : win === 0
                ? "JACKPOT!!!"
                : `You ${logs[0]["message"]}`}
            </Grid.Row>
          ) : null}
          <Grid.Row columns={3} textAlign="center" className={styles.container}>
            <Stats state={state} />
          </Grid.Row>
          <Grid.Row>
            <Grid.Column textAlign="center" style={{ marginTop: "4vh" }}>
              <Spinner
                reels={reels}
                currentReel={currentReel}
                spinner={spinner}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row columns={isOwner ? 3 : 2} style={{ marginTop: "4vh" }}>
            <Grid.Column>
              <Activity
                winners={winners}
                web3={injected}
                className={styles.container}
              />
            </Grid.Column>
            {isOwner ? (
              <Grid.Column>
                <Button
                  fluid
                  loading={loading}
                  content="load"
                  onClick={loadMoney}
                  disabled={loading}
                  className={styles.neoBtn}
                />
              </Grid.Column>
            ) : null}
            <Grid.Column floated="right">
              {injected.accounts && injected.accounts.length ? (
                <Button
                  fluid
                  content="Play"
                  onClick={getLucky}
                  loading={loading}
                  disabled={loading}
                  className={styles.neoBtn}
                />
              ) : (
                <Auth web3Context={injected} />
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </>
  );
}

export default App;

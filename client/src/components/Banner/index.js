import React from "react";
import { Container, Grid, Header } from "semantic-ui-react";

export default function Banner(props) {
  const { balance } = props;
  return (
    <Container style={{ margin: "3em" }}>
      <Grid divided="vertically" columns={2}>
        <Grid.Column floated="left" textAlign="left">
          <Header
            content="ETH$lot"
            style={{ fontSize: "2em", fontStyle: "italic", fontWeight: "bold" }}
          />
        </Grid.Column>
        <Grid.Column floated="right" textAlign="right">
          {!isNaN(balance) ? (
            <Header content={`${Number(balance).toFixed(5)} ETH`} />
          ) : null}
        </Grid.Column>
      </Grid>
    </Container>
  );
}

/*
 * The Frontend is inspired by the #LearnDocker workshop's TodoApp implementation
 * license: "MIT"
 */

const providers = [
  "New York Times",
  "The Economist",
  "Thomson Reuters",
  "Bloomberg",
  "The Wall Street Journal",
  "The Next Web",
  "Techcrunch",
  "Forbes",
  "INC.com",
  "The Telegraph",
  "HVG Business",
];

function App() {
  const { Container, Row, Col } = ReactBootstrap;
  return (
    <Container>
      <Row>
        <h1 className="title">Tone of Voice for media outlets</h1>
        <Col md={{ offset: 1, span: 10 }}>
          <ToneOfVoiceList />
        </Col>
      </Row>
    </Container>
  );
}

function ToneOfVoiceList() {
  const { Container } = ReactBootstrap;

  const [items, setItems] = React.useState(null);

  React.useEffect(() => {
    fetch("/api/v1/list")
      .then((r) => r.json())
      .then(({ data }) => setItems(data));
    setInterval(() => {
      fetch("/api/v1/list")
        .then((r) => r.json())
        .then(({ data }) => setItems(data));
    }, 3000);
  }, []);

  const onNewItem = React.useCallback(
    (newItem) => {
      setItems([newItem, ...items]);
    },
    [items]
  );

  if (items === null) return "Loading...";

  return (
    <React.Fragment>
      <RequestToneOfVoiceForm onNewItem={onNewItem} />
      {items.length === 0 && (
        <p className="text-center">You have no responses yet.</p>
      )}
      <Container fluid className="grid">
        {items.map((item) => (
          <ToneOfVoiceItem item={item} key={item.id} />
        ))}
      </Container>
    </React.Fragment>
  );
}

function RequestToneOfVoiceForm({ onNewItem }) {
  const { Form, InputGroup, Button, Row, Col, Alert } = ReactBootstrap;

  const [outlet, setOutlet] = React.useState(providers[0]);

  const [submitting, setSubmitting] = React.useState(false);

  const [error, setError] = React.useState(null);

  const handleErrors = (response) => {
    if (!response.ok) {
      response.json().then((error) => {
        setSubmitting(false);
        setError(error);
      });
      throw Error("Error 500");
    }
    return response;
  };

  const submitNewItem = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    fetch(`/api/v1/${outlet}`, {
      method: "GET",
    })
      .then(handleErrors)
      .then((r) => r.json())
      .then(({ data }) => {
        onNewItem(data);
        setSubmitting(false);
      })
      .catch((error) => {
        console.error(error.message);
      });
  };

  const getErrorBox = () => {
    if (error) {
      return (
        <Alert className="margin-top-10" variant="danger">
          {`${error.message}`}
        </Alert>
      );
    }
    return "";
  };

  return (
    <Form onSubmit={submitNewItem} className="tone-of-voice-request">
      <Form.Group as={Row}>
        <Form.Label column sm="3">
          Media outlets
        </Form.Label>
        <Col sm="9">
          <Form.Control as="select" onChange={(e) => setOutlet(e.target.value)}>
            {providers.map((provider) => (
              <option value={provider}>{provider}</option>
            ))}
          </Form.Control>
        </Col>
      </Form.Group>
      <InputGroup.Append>
        <Button
          type="submit"
          variant="success"
          className={submitting ? "disabled" : ""}
        >
          {submitting ? "Requesting..." : "Send request"}
        </Button>
      </InputGroup.Append>
      {getErrorBox()}
    </Form>
  );
}

function ToneOfVoiceItem({ item }) {
  const { Row, Col, Button } = ReactBootstrap;

  const getMessageFromServer = (outlet) => {
    fetch(`/api/v1/${outlet}/message`, {
      method: "POST",
      body: JSON.stringify({
        message: "Make a birthday message for Richard Branson",
      }),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((r) => r.json())
      .then(({ data }) => {
        alert(data);
      });
  };

  return (
    <React.Fragment>
      <Row className="grid-row">
        <Col xs={12} className="filename">
          {item.provider}
        </Col>
      </Row>
      <Row className="grid-row" xs={12}>
        <Col className={`padding-top-11`}>
          <pre>{item.response}</pre>
        </Col>
      </Row>
      <Row className="grid-row" xs={12}>
        <Col className={`padding-top-11`}>
          <Button
            type="submit"
            onClick={() => getMessageFromServer(item.provider)}
          >
            Get a birthday message for Richard Branson in this tone
          </Button>
        </Col>
      </Row>
      <Row className="grid-row" xs={12}>
        <Col className={`text-center padding-top-11`}>
          <span className="dates">
            Created at: {new Date(item.createdAt).toUTCString()}, updated:{" "}
            {new Date(item.updatedAt).toUTCString()}
          </span>
        </Col>
      </Row>
    </React.Fragment>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

import ForgeUI, {
  render,
  Fragment,
  Text,
  IssuePanel,
  useProductContext,
  useState,
  Image,
  Button,
  ButtonSet,
  Table,
  Head,
  Row,
  Cell,
  ModalDialog
} from "@forge/ui";
import api, { fetch } from "@forge/api";
import BooksData from "./books.json";

const selectRandomBook = () => {
  return BooksData.Books[Math.floor(Math.random() * BooksData.Books.length)];
};

const fetchBook = async (isbn) => {
  let response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.apikey}`
  );
  if (response.ok) {
    let json = await response.json();
    return json;
  }
};

const createIssue = async (summary, description, config) => {
  console.log(config);
  const response = await api.asApp().requestJira("/rest/api/2/issue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: {
          key: config.projectKey,
        },
        issuetype: {
          name: "Task",
        },
        assignee: {
          id: config.assignee,
        },
        summary: summary,
        description: description,
      },
    }),
  });
  const responseBody = await response.json();
  if (!response.ok) {
    console.error(responseBody);
    const errorMessage = responseBody.errorMessages[0];
  } else {
    console.log(responseBody.key);
  }
};

const App = () => {
  const context = useProductContext();
  const [isOpen, setOpen] = useState(false);
  const [book, setBook] = useState(async () => await fetchBook(selectRandomBook()));
  const newBook = async () => {
    setBook(await fetchBook(selectRandomBook()));
  };
  const config = {
    projectKey: context.platformContext.projectKey,
    issueTypeId: 10000,
    reporter: context.accountId,
    assignee: context.accountId,
  };
  return (
    <Fragment>
      <Table>
        <Head>
          <Cell>
            <Text content="Cover" />
          </Cell>
          <Cell>
            <Text content="Title" />
          </Cell>
          <Cell>
            <Text content="Action" />
          </Cell>
        </Head>
        <Row>
          <Cell>
            <Image
              src={book.items[0].volumeInfo.imageLinks.smallThumbnail}
              alt="book cover"
            />
          </Cell>
          <Cell>
            <Text>{book.items[0].volumeInfo.title}</Text>
          </Cell>
          <Cell>
            <ButtonSet>
            <Button
              text="Book Details"
              onClick={() => setOpen(true)}
            />
            <Button
              text="Add to task"
              onClick={() =>
                createIssue(
                  `Read ${book.items[0].volumeInfo.title}`,
                  `${book.items[0].volumeInfo.description}`,
                  config
                )
              }
            />
            </ButtonSet>
            
          </Cell>
        </Row>
      </Table>

      <Button text="Show me another!" onClick={() => newBook()} />
      {isOpen && (
        <ModalDialog header={`${book.items[0].volumeInfo.title} Details`} onClose={() => setOpen(false)}>
          <Text>*{`${book.items[0].volumeInfo.subtitle}* </Text>
          <Text>Published: **${book.items[0].volumeInfo.publishedDate}`}**</Text>
          <Text>**{`${book.items[0].volumeInfo.authors.map(author=>(`${author}.`))}`}**</Text>
          <Text>Pages: {book.items[0].volumeInfo.pageCount}</Text>
          <Text>{book.items[0].volumeInfo.description}</Text>
        </ModalDialog>
      )}
    </Fragment>
  );
};

export const run = render(
  <IssuePanel>
    <App />
  </IssuePanel>
);

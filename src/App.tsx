import React, {
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { MDXProvider } from "@mdx-js/react";

import "./App.css";

import linkIconSrc from "./assets/link.svg";
import Docs from "../readme.mdx";
import { CodeBlock } from "./components/code-block";
import { Fzf, FzfResultItem } from "fzf";

function getAnchor(text: string) {
  return text
    .toLowerCase()
    .replace(/[ \(\.]/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const getHeading = (level: number) => {
  const Heading = (props: HeadingProps, ref: React.Ref<HTMLHeadingElement>) => {
    let anchor = getAnchor(
      typeof props.children === "string" ? getAnchor(props.children) : ""
    );
    if (!anchor) {
      if (isValidElement(props.children)) {
        const elProps = props.children.props;
        const children = elProps["children"];
        if (typeof children === "string") {
          anchor = getAnchor(children);
        }
      }
    }

    const link = `#${anchor}`;

    return React.createElement(
      `h${level}`,
      {
        id: anchor,
        ref,
      },
      [
        <React.Fragment key="1">
          {props.children}
          <a
            href={link}
            className="heading-link"
            style={{ textDecoration: "none" }}
          >
            <img
              src={linkIconSrc}
              className="w-5 inline-block ml-2"
              style={{ marginTop: 0, marginBottom: 0 }}
            />
          </a>
        </React.Fragment>,
      ]
    );
  };

  return forwardRef(Heading);
};

const mdxComponents = {
  wrapper: (props: any) => (
    <div className="container mx-auto prose lg:max-w-3xl px-3 sm:px-0">
      <main {...props} />
    </div>
  ),
  code: CodeBlock as React.ComponentType<{ children: React.ReactNode }>,
  // headings
  ...[2, 3, 4].reduce<Record<string, ReturnType<typeof getHeading>>>(
    (prev, curr) => {
      prev[`h${curr}`] = getHeading(curr);
      return prev;
    },
    {}
  ),
};

export function App() {
  useEffect(() => {
    document.body.classList.add("overflow-y-scroll");
    return () => document.body.classList.remove("overflow-y-scroll");
  });

  const fzfRef = useRef<Fzf<string>>(new Fzf([]));
  const [entries, setEntries] = useState<FzfResultItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const h2Nodes = document.querySelectorAll("h2");
    const h2Arr = Array.from(h2Nodes)
      .map((v) => v.textContent)
      .filter((v) => v !== null) as string[];

    const h3Nodes = document.querySelectorAll("h3");
    const h3Arr = Array.from(h3Nodes)
      .map((v) => v.textContent)
      .filter((v) => v !== null) as string[];

    fzfRef.current = new Fzf([...h2Arr, ...h3Arr], {
      maxResultItems: 4,
    });
  }, []);

  const find = (query: string) => {
    setInput(query);
    const entries = fzfRef.current.find(query);
    setEntries(entries);

    const el = document.querySelector("#yas");
    if (!el) return;
    el.innerHTML = "";
    if (entries.length === 0) {
      return;
    }
    const v = entries
      .map((v) => v.item)
      .map(getAnchor)
      .map((v) => document.getElementById(v))
      .filter((v) => v !== null)
      .map((v) => {
        if (!v) return [];
        const vLevel = parseInt(v.nodeName[1], 10);
        // how can a doesn't have a number at its first index??
        // anyway if this is the case we'll make early return
        if (isNaN(vLevel)) return [];
        const arr: Element[] = [v];
        if (!v.nextElementSibling) {
          return arr;
        }

        const nextNodematch = v.nextElementSibling.nodeName.match(/^h\d$/i);
        if (nextNodematch) {
          const nextNodeLevel = parseInt(nextNodematch[0][1], 10);
          if (nextNodeLevel <= vLevel) {
            return arr;
          } else {
            arr.push(v.nextElementSibling);
          }
        } else {
          arr.push(v.nextElementSibling);
        }

        if (!v.nextElementSibling.nextElementSibling) {
          return arr;
        }

        const nextToNextmatch =
          v.nextElementSibling.nextElementSibling.nodeName.match(/^h\d$/i);
        if (nextToNextmatch) {
          const nextToNextLevel = parseInt(nextToNextmatch[0][1], 10);
          if (nextToNextLevel <= vLevel) {
            return arr;
          } else {
            arr.push(v.nextElementSibling.nextElementSibling);
          }
        } else {
          arr.push(v.nextElementSibling.nextElementSibling);
        }

        return arr;
      });

    const br = document.createElement("div");
    br.classList.add("bg-gray-200");
    br.classList.add("h-1");
    // br.classList.add("br-fade");

    const fin = v
      .map((v) => [...v, br])
      .flat()
      .map((e) => e.cloneNode(true));
    // @ts-ignore
    el.append(...fin);
  };

  const navigateToFirstEntry = () => {
    const el = document.querySelector("#yas");
    if (el) el.innerHTML = "";
    setInput("");
    if (entries[0]) window.location.hash = getAnchor(entries[0].item);
  };

  return (
    <div className="min-h-screen antialiased break-words py-6">
      <MDXProvider components={mdxComponents}>
        <div className="container mx-auto prose lg:max-w-3xl px-3 sm:px-0">
          <h1>What's new in ECMA / JavaScript cheat sheet</h1>
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              navigateToFirstEntry();
            }}
          >
            <input
              className="border-b-2 w-64 outline-none focus:border-green-300"
              placeholder="Type to search..."
              value={input}
              onChange={(ev) => find(ev.target.value)}
            />
          </form>
          <div key="1" id="yas" />
        </div>
        <div className={input ? "hidden" : ""}>
          <Docs />
        </div>
      </MDXProvider>
    </div>
  );
}

export default App;

# richoutput-js

![Github Actions Status](https://github.com/jupyterlab/richoutput-js/workflows/Build/badge.svg)

A JupyterLab extension for rendering ES6 Rich Output files.

An example mimebundle:

```json
{
    "application/vnd.jupyter.es6-rich-output": "a string that will be the src of a script tag, i.e., a url, data url, etc.",
    "application/vnd.jupyter.datagrid+json": {
        "data": ["some", "data", "in", "a", "structure", "which", "the", "js", "can", "access"]
    },
    "text/html": "fallback rendering of your data",
    "text/plain": "fallback rendering of your data"
}
```

The mimebundle renderer for `application/vnd.jupyter.es6-rich-output` does a System.import of the url as an object, then calls the render method if it exists with a context object, awaiting the returned `Promise<void>` before moving to the next output.


The context object has mandatory fields:

- `output`: {'data': {...}, 'metadata': {...}} (which is the display_data or execute_result message data/metadata fields). Changes are not respected - treat it as immutable. 
  - Should the `transient` data also be passed in???
- `element`: HTMLDivElement


Optional fields:
- `render(output, element): Promise<void>`: 
  - `output`: a kernel iopub stream, display_data, execute_result, error message (i.e., inputs into the rendering system)
    - Should these be formatted for nbformat (e.g., transient field is not included)???
  - `element`: an HTMLDivElement
  - Promise resolves when the rendering callback returns
- `comms`: See Colab interface...
  - `Comm` interface
  - `open("target")`: 
- `sharedState`: Map([@@Symbol]: Any) - shared state that might span render calls or contexts. This is considered mutable, in that a renderer can share things with other render calls, replace implementations, etc.
  - Let's explore exactly the scope of shared state (e.g., per kernel, per document, etc.). Does there need to be different scopes, or a way to introspect the scopes, etc.???
- 



## Requirements

* JupyterLab >= 3.0

## Install

```bash
pip install richoutput-js
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the richoutput-js directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Uninstall

```bash
pip uninstall richoutput-js
jupyter labextension uninstall richoutput-js
```

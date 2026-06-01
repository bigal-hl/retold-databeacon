Retold DataBeacon
=================

A deployable data beacon service for the Retold ecosystem. Connect to remote databases, introspect their schemas, generate REST endpoints, and expose beacon capabilities to the Ultravisor mesh.

DataBeacon is designed to run on remote machines where you need to bridge access to databases that are not directly reachable from your primary infrastructure. Deploy it as a Docker container, point it at one or many databases, and instantly get REST APIs and Ultravisor beacon integration for any table you discover.

> **[Read the Retold-Databeacon Documentation](https://fable-retold.github.io/retold-databeacon/)** - interactive docs with the full API reference.

## Features

- **Multi-Database Connectivity** -- connect to MySQL, PostgreSQL, MSSQL, SQLite, MongoDB, RocksDB, and Solr through meadow-connection-manager
- **Schema Introspection** -- automatically discover tables, columns, types, primary keys, and constraints from any connected database
- **Dynamic REST Endpoints** -- enable standard CRUD REST APIs for any introspected table with a single click
- **Ultravisor Beacon** -- register as a beacon in the Ultravisor mesh, exposing data access and management capabilities for distributed orchestration
- **Web UI** -- built-in Pict-based web interface for managing connections, browsing schemas, and monitoring endpoints
- **Docker-Ready** -- multi-stage Dockerfile with SQLite persistence via volume mounts
- **CLI and Library** -- use as a global CLI tool, a local development server, or embed as a dependency in your own application
- **Retold Facto Integration** -- compatible with retold-facto projections for mapping remote database tables into the Facto data pipeline

## Documentation

Comprehensive documentation is available in the [docs](./docs) folder:

- [Overview](./docs/README.md) -- Introduction and getting started
- [Quick Start](./docs/quickstart.md) -- Get running in under five minutes
- [Architecture](./docs/architecture.md) -- System design with Mermaid diagrams
- [Implementation Reference](./docs/implementation-reference.md) -- Detailed implementation guide
- [API Reference](./docs/api/) -- Per-function developer reference

### Usage Workflows

Step-by-step walkthroughs for real-world deployment scenarios:

- [Global CLI Install](./docs/examples/workflow-global-cli.md)
- [Local Development](./docs/examples/workflow-local-development.md)
- [Docker Local](./docs/examples/workflow-docker-local.md)
- [Docker Remote Deployment](./docs/examples/workflow-docker-remote.md)
- [Embedding as a Library](./docs/examples/workflow-embedding-library.md)
- [Facto Projection Pipeline](./docs/examples/workflow-facto-projection.md)

## Install

```sh
$ npm install retold-databeacon
```

Or install globally for CLI usage:

```sh
$ npm install -g retold-databeacon
```

## Quick Start

### As a CLI

```sh
# Initialize a database and start the server
retold-databeacon init
retold-databeacon serve
# Or with options
retold-databeacon serve --port 9000 --db /mnt/data/beacon.sqlite
```

### As a Library

```javascript
const libPict = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('retold-databeacon');

const fable = new libPict({
	Product: 'MyApp',
	ProductVersion: '1.0.0',
	APIServerPort: 8389,
	SQLite: { SQLiteFilePath: './data/databeacon.sqlite' }
});

fable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
fable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

fable.MeadowConnectionManager.connect('internal',
	{ Type: 'SQLite', SQLiteFilePath: './data/databeacon.sqlite' },
	(pError, pConnection) =>
	{
		fable.MeadowSQLiteProvider = pConnection.instance;

		fable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
		const beacon = fable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
			{ AutoCreateSchema: true });

		beacon.initializeService(
			(pInitError) =>
			{
				console.log('DataBeacon running on port 8389');
			});
	});
```

### With Docker

```sh
# Build
docker build -t retold-databeacon .

# Run with a persistent volume
docker run -d -p 8389:8389 -v /path/to/data:/app/data retold-databeacon
```

Then open `http://localhost:8389` to access the web UI.

## Configuration

DataBeacon accepts configuration via CLI flags, a JSON config file, or environment variables:

| Option | CLI Flag | Default | Description |
|--------|----------|---------|-------------|
| Port | `--port`, `-p` | `8389` | HTTP server port |
| Database Path | `--db`, `-d` | `./data/databeacon.sqlite` | SQLite file path |
| Config File | `--config`, `-c` | -- | Path to JSON config file |
| Log File | `--log`, `-l` | -- | Write logs to file |

Environment variable: `PORT` overrides the default port.

## REST API Overview

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/beacon/connections` | List all connections |
| POST | `/beacon/connection` | Create a connection |
| POST | `/beacon/connection/:id/connect` | Establish live connection |
| POST | `/beacon/connection/:id/introspect` | Introspect database schema |
| GET | `/beacon/connection/:id/tables` | List introspected tables |
| POST | `/beacon/endpoint/:connId/:table/enable` | Enable CRUD endpoints |
| GET | `/beacon/endpoints` | List active dynamic endpoints |
| GET | `/1.0/{Table}s/{Begin}/{Cap}` | Read records (dynamic) |
| POST | `/beacon/ultravisor/connect` | Connect to Ultravisor mesh |

## Testing

```sh
npm test
```

## Building

```sh
# Build the web UI bundle
npm run build

# Build Docker image
npm run docker-build
```

## Related Packages

- [fable](https://github.com/fable-retold/fable) -- Service dependency injection and configuration
- [meadow](https://github.com/fable-retold/meadow) -- Data access layer and ORM
- [meadow-endpoints](https://github.com/fable-retold/meadow-endpoints) -- Automatic REST endpoint generation
- [meadow-connection-manager](https://github.com/fable-retold/meadow-connection-manager) -- Multi-database connection management
- [orator](https://github.com/fable-retold/orator) -- API server abstraction
- [retold-facto](https://github.com/stevenvelozo/retold-facto) -- Data warehouse and knowledge graph storage
- [ultravisor](https://github.com/stevenvelozo/ultravisor) -- Workflow orchestration engine
- [ultravisor-beacon](https://github.com/stevenvelozo/ultravisor-beacon) -- Beacon registration for Ultravisor mesh
- [pict](https://github.com/fable-retold/pict) -- MVC framework for web applications

## License

[MIT](LICENSE)

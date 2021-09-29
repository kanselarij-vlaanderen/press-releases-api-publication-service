# press-releases-belga-publication-service

This microservice looks for publication tasks that have its publication-channel set to "Belga", are not
started yet (`adms:status`) and its publication-event has no `ebucore:publicationEndDateTime` yet.

For every result found, it generates an xml file, updates the statuses and dates and puts the xml file on the ftp server of Belga.

## Tutorials
### Add the service to a stack
Add the service to your `docker-compose.yml`:

```yaml
services:
  press-releases-belga-publication:
    image: kanselarij/press-releases-belga-publication-service:0.1.0
    volumes:
      - ./data/belga:/share
    restart: always
    logging: *default-logging
```
The mounted volume `./data/belga` is the location where the xml files will be stored.

Next, make the service listen for new conversion tasks. Assuming a delta-notifier is already available in the stack, add the following rules to the delta-notifier's configuration in `./config/delta/rules.js`.

```javascript
{
    match: {
        predicate: {
            type: 'uri',
            value: 'http://www.w3.org/ns/adms#status'
        },
        object: {
            type: 'uri',
            value: 'http://themis.vlaanderen.be/id/concept/publication-task-status/not-started'
        },
    },
    callback: {
        url: 'http://press-releases-belga-publication/delta',
        method: 'POST'
    },
    options: {
        resourceFormat: 'v0.0.1',
        gracePeriod: 250,
        ignoreFromSelf: true
    },
}
```

## Reference

### Configuration

The following environment variables have to be configured:

| Key | type | description |
|-----|------|---------|
| BELGA_FTP_USERNAME | string | username to connect to the ftp server |
| BELGA_FTP_PASSWORD | string | password to connect to the ftp server |
| BELGA_FTP_HOST | string | host of the ftp server |

The service will fail if the environment variables are not defined properly.


### Model

#### Used prefixes
| Prefix | URI                                                       |
|--------|-----------------------------------------------------------|
| dct    | http://purl.org/dc/terms/                                 |
| adms   | http://www.w3.org/ns/adms#                                |
| ext    | http://mu.semte.ch/vocabularies/ext                       |
| nie    | http://www.semanticdesktop.org/ontologies/2007/01/19/nie# |


#### Publication task
##### Class
`ext:PublicationTask`
##### Properties
| Name                | Predicate                | Range           | Definition                                                                                                                                                 |
|---------------------|--------------------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| status              | `adms:status`            | `rdfs:Resource` | Status of the publication task, having value `<http://themis.vlaanderen.be/id/concept/publication-task-status/not-started>` when this service is triggered |
| created             | `dct:created`            | `xsd:dateTime`  | Datetime of creation of the task                                                                                                                           |
| modified            | `dct:modified`           | `xsd:dateTime`  | Datetime of the last modification of the task                                                                                                              |
| publication-channel | `ext:publicationChannel` | `rdfs:Resource` | Publication channel related to the task. Only the Belga publication channel (`http://themis.vlaanderen.be/id/publicatiekanaal/04a5d121-c991-493c-b645-b0c67cc53cf6`) is of interest to this service                                              |
| content             | `nie:htmlContent`        | `string`        | The html content generated for the Belga press release                                                                                                     |


#### Publication task statuses
The status of the publication task will be updated to reflect the progress of the task. The following statuses are known:
* http://themis.vlaanderen.be/id/concept/publication-task-status/not-started
* http://themis.vlaanderen.be/id/concept/publication-task-status/ongoing
* http://themis.vlaanderen.be/id/concept/publication-task-status/success
* http://themis.vlaanderen.be/id/concept/publication-task-status/failed

### API
```
POST /delta
```
Endpoint that receives delta's from the delta-notifier and executes a publication task when this task is ready for publication. A successfully completed publication task will result in an xml file being put on the ftp server of Belga.
The endpoint is triggered externally whenever a publication task is ready for processing and is not supposed to be triggered manually.

### Responses

| status | description |
|-------|-------------|
| 202 | Accepted, request to check for publication-tasks is successfully received. |









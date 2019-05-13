import {
    Graph,
    Optional,
    optional,
    Prefix,
    prefix,
    Triple,
    Query,
    triple,

} from "sparql-query-builder/dist";
import { NoctuaQuery } from "./models/noctua-query";

let buildAllQuery = () => {
    let query = new NoctuaQuery();

    query.contributor('"http://orcid.org/0000-0002-2874-6934"^^xsd:string')

    return query.build();
}


console.log(buildAllQuery());

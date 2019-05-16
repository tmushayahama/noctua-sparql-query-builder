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

    query
        // .goterm('GO:0017127')
        .goterm('GO:0005525')
        //.gp('http://identifiers.org/uniprot/O95477')
        .gp('<http://identifiers.org/uniprot/P42574>')
        // .contributor('"http://orcid.org/0000-0002-2874-6934"^^xsd:string') //Tre
        .contributor('"http://orcid.org/0000-0002-1706-4196"^^xsd:string')//Kimberly

    return query.build();
}


console.log(buildAllQuery());

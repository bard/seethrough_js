/*
 * Copyright 2008 by Massimiliano Mirra
 *
 * This file is part of seethrough.
 *
 * seethrough is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * SamePlace is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The interactive user interfaces in modified source and object code
 * versions of this program must display Appropriate Legal Notices, as
 * required under Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License
 * version 3, modified versions must display the "Powered by SamePlace"
 * logo to users in a legible manner and the GPLv3 text must be made
 * available to them.
 *
 * Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>
 *
 */


var ns_st = 'http://hyperstruct.net/seethrough#js';

XML.ignoreComments = false;

var examples = [
    {
        name: 'content',

        template: <div xmlns:st={ns_st} st:content='meta.title'/>,

        env: {
            meta: { title: 'Hello, world!' }
        },

        result: <div xmlns:st={ns_st}>Hello, world!</div>
    },

    {
        name: 'replace',

        template:
            <div xmlns:st={ns_st}>
            <span st:replace='meta.title'/>
            </div>,

        env: {
            meta: { title: 'Hello, world!' }
        },

        result:
            <div xmlns:st={ns_st}>Hello, world!</div>
    },

    {
        name: 'disable',

        template:
            <div xmlns:st={ns_st}>
            <span st:disable='true'>Hello, world!</span>
            </div>,

        env: {},

        result:
            <div xmlns:st={ns_st}/>,
    },

    {
        name: 'loop',

        template:
            <ul xmlns:st={ns_st}>
            <li st:loop='person people'>
            <span st:replace='person'/>
            </li>
            </ul>,

        env: {
            people: ['jim', 'spock', 'mccoy']
        },

        result:
            <ul xmlns:st={ns_st}>
            <li>jim</li>
            <li>spock</li>
            <li>mccoy</li>
            </ul>
    },

    {
        name: 'condition',

        template:
            <div xmlns:st={ns_st}>
            <span st:condition="flag1">I will be here</span>
            <span st:condition="flag2">I probably will not</span>
            </div>,

        env: {
            flag1: true,
            flag2: false
        },

        result:
            <div xmlns:st={ns_st}>
            <span>I will be here</span>
            </div>
    },

    {
        name: 'attribute',

        template:
            <div xmlns:st={ns_st}>
            <div><st:attr name="foo">bar</st:attr></div>
            </div>,

        env: {},

        result:
            <div xmlns:st={ns_st}>
            <div foo="bar"/>
            </div>
    },

    // The next ones don't describe any new tag or attribute, they
    // just check formerly buggy situations.

    {
        name: 'attribute on looping item',

        template:
            <div xmlns:st={ns_st}>
            <ol>
            <li st:loop="item items">
            <st:attr name="_id"><span st:replace="item._id"/></st:attr>
            <span st:replace="item.name"/>
            </li>
            </ol>
            </div>,

        env: {
            items: [
                { _id: 1, name: 'foo' },
                { _id: 2, name: 'bar' }
            ]
        },

        result:
            <div xmlns:st={ns_st}>
            <ol>
            <li _id="1">foo</li>
            <li _id="2">bar</li>
            </ol>
            </div>
    },

    {
        name: 'handle comments',

        template:
            <head><!-- [if lt IE 8]>
            <script type="text/javascript" src="/static/IE8.js"> </script>
            <![endif]-->
            </head>,

        env: {},

        result:
            <head><!-- [if lt IE 8]>
            <script type="text/javascript" src="/static/IE8.js"> </script>
            <![endif]-->
            </head>
    },

    {
        name: 'preserve spaces',

        template: <head><script> </script></head>,

        env: {},

        result: <head><script> </script></head>
    },

    {
        name: 'empty children',

        template: <div xmlns:st={ns_st}><head/></div>,

        env: {},

        result: <div xmlns:st={ns_st}><head/></div>
    }
];

function verify() {
    function compareXML(t1, t2) {
        function compareXML1(tree1, tree2) {
            if(tree1.nodeKind() != tree2.nodeKind())
                throw new Error('Different node kinds. (' +
                                tree1.nodeKind() + ',' + tree2.nodeKind() + ')');

            switch(tree1.nodeKind()) {
            case 'element':
                if(tree1.name() != tree2.name())
                    throw new Error('Different tag names. (' +
                                    '<' + tree1.name() + '>, ' + '<' + tree2.name() + '>)');
                break;
            case 'text':
            case 'comment':
                if(tree1.valueOf() != tree2.valueOf())
                    throw new Error('Different ' + tree1.nodeKind() + ' values. (' +
                                    '<' + tree1.valueOf() + '>, ' + '<' + tree2.valueOf() + '>)');

                break;
            default:
                throw new Error('Unhandled node kind. (' + tree1.nodeKind() + ')');
            }

            var attrList1 = tree1.@*;
            var attrList2 = tree2.@*;
            if(attrList1.length() != attrList2.length())
                throw new Error('Different attribute count for <' + tree1.name() + '>. (expected ' +
                                attrList1.length() + ', got ' + attrList2.length() + ')');

            var childList1 = tree1.*;
            var childList2 = tree2.*;
            if(childList1.length() != childList2.length())
                throw new Error('Different child count for <' + tree1.name() + '>. (expected ' +
                                childList1.length() + ', got ' + childList2.length() + ')');

            for each(var attr in attrList1) {
                if(tree1['@' + attr.name()] != tree2['@' + attr.name()])
                    throw new Error('Different values for attribute @' + attr.name() + '. (expected ' +
                                    tree1['@' + attr.name()] + ', got ' + tree2['@' + attr.name()] + ')');
            }

            for(var i=0; i<childList1.length(); i++)
                compareXML(childList1[i], childList2[i])

        }

        t1.normalize();
        t2.normalize();
        compareXML1(t1, t2);
        return true;
    }

    var results = examples.map(function(example) {
        try {
            d.on = example.debug;
            var rendered = seethrough
                .compile(example.template)
                .call(null, example.env)
            compareXML(example.result, rendered);
        } catch(e) {
            return 'FAILURE: ' + example.name + '\n' +
                e.message + '\n' +
                e.stack + '\n' +
                rendered.toXMLString();
        }
    }).filter(function(result) { return result; });

    if(results.length > 0)
        return results.join('\n');
    else
        return ('\n**************************************************\n' +
                'Verified successfully.\n\n' +
                '**************************************************');
};

print(verify());

// Use `M-x recompile' to verify tests from Emacs (assumes
// spidermonkey is available somewhere as `js'')

// -*- compile-command: "cat seethrough.js examples.js | js"

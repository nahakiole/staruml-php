/*
 * Copyright (c) 2014-2018 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

const fs = require('fs');
const path = require('path');
const codegen = require('./codegen-utils');

/**
 * PHP Code Generator
 */
class PHPCodeGenerator {

    /**
     * @constructor
     *
     * @param {type.UMLPackage} baseModel
     * @param {string} basePath generated files and directories to be placed
     */
    constructor(baseModel, basePath) {
        /** @member {type.Model} */
        this.baseModel = baseModel;

        /** @member {string} */
        this.basePath = basePath
    }

    /**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    getIndentString(options) {
        if (options.useTab) {
            return '\t'
        } else {
            var i;
            var len;
            var indent = [];
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(' ')
            }
            return indent.join('')
        }
    }

    /**
     * Generate codes from a given element
     * @param {type.Model} elem
     * @param {string} basePath
     * @param {Object} options
     */
    generate(elem, basePath, options) {
        var fullPath;
        var codeWriter;

        // Package
        if (elem instanceof type.UMLPackage) {
            fullPath = path.join(basePath, elem.name);
            fs.mkdirSync(fullPath);
            if (Array.isArray(elem.ownedElements)) {
                elem.ownedElements.forEach(child => {
                    return this.generate(child, fullPath, options)
                })
            }
        } else if (elem instanceof type.UMLClass) {
            // AnnotationType
            if (elem.stereotype === 'annotationType') {
                fullPath = path.join(basePath, elem.name + '.php');
                codeWriter = new codegen.CodeWriter(this.getIndentString(options));
                codeWriter.writeLine("<?php");

                if (options.useStrictTypes === true) {
                    codeWriter.writeLine("");
                    codeWriter.writeLine("declare(strict_types=1);");
                    codeWriter.writeLine("");
                }

                this.writePackageDeclaration(codeWriter, elem, options);
                codeWriter.writeLine();
                this.writeAnnotationType(codeWriter, elem, options);
                fs.writeFileSync(fullPath, codeWriter.getData())
                // Class
            } else {
                fullPath = basePath + '/' + elem.name + '.php';
                codeWriter = new codegen.CodeWriter(this.getIndentString(options));
                codeWriter.writeLine("<?php");

                if (options.useStrictTypes === true) {
                    codeWriter.writeLine("");
                    codeWriter.writeLine("declare(strict_types=1);");
                    codeWriter.writeLine("");
                }

                this.writePackageDeclaration(codeWriter, elem, options);
                codeWriter.writeLine();
                this.writeClass(codeWriter, elem, options);
                fs.writeFileSync(fullPath, codeWriter.getData())
            }

            // Interface
        } else if (elem instanceof type.UMLInterface) {
            fullPath = basePath + '/' + elem.name + '.php';
            codeWriter = new codegen.CodeWriter(this.getIndentString(options));
            codeWriter.writeLine("<?php");

            if (options.useStrictTypes === true) {
                codeWriter.writeLine("");
                codeWriter.writeLine("declare(strict_types=1);");
                codeWriter.writeLine("");
            }

            this.writePackageDeclaration(codeWriter, elem, options);
            codeWriter.writeLine();
            this.writeInterface(codeWriter, elem, options);
            fs.writeFileSync(fullPath, codeWriter.getData())

            // Enum
        } else if (elem instanceof type.UMLEnumeration) {
            fullPath = basePath + '/' + elem.name + '.php';
            codeWriter = new codegen.CodeWriter(this.getIndentString(options));
            codeWriter.writeLine("<?php");

            if (options.useStrictTypes === true) {
                codeWriter.writeLine("");
                codeWriter.writeLine("declare(strict_types=1);");
                codeWriter.writeLine("");
            }
            
            this.writePackageDeclaration(codeWriter, elem, options);
            codeWriter.writeLine();
            this.writeEnum(codeWriter, elem, options);
            fs.writeFileSync(fullPath, codeWriter.getData())
        }
    }

    /**
     * Return visibility
     * @param {type.Model} elem
     * @return {string}
     */
    getVisibility(elem) {
        switch (elem.visibility) {
            case type.UMLModelElement.VK_PUBLIC:
                return 'public';
            case type.UMLModelElement.VK_PROTECTED:
                return 'protected';
            case type.UMLModelElement.VK_PRIVATE:
                return 'private'
        }
        return null
    }

    /**
     * Collect modifiers of a given element.
     * @param {type.Model} elem
     * @return {Array.<string>}
     */
    getModifiers(elem) {
        var modifiers = [];

        if (!(elem instanceof type.UMLClass)) {
            var visibility = this.getVisibility(elem);
            if (visibility) {
                modifiers.push(visibility)
            }
        }

        if (elem.isStatic === true) {
            modifiers.push('static')
        }
        if (elem.isAbstract === true) {
            modifiers.push('abstract')
        }
        // transient
        // strictfp
        // const
        // native
        return modifiers
    }

    /**
     * Collect super classes of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    getSuperClasses(elem) {
        var generalizations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLGeneralization && rel.source === elem)
        });
        return generalizations.map(function (gen) {
            return gen.target
        })
    }

    /**
     * Collect super interfaces of a given element
     * @param {type.Model} elem
     * @return {Array.<type.Model>}
     */
    getSuperInterfaces(elem) {
        var realizations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLInterfaceRealization && rel.source === elem)
        });
        return realizations.map(function (gen) {
            return gen.target
        })
    }

    /**
     * Return type expression
     * @param {type.Model} elem
     * @return {string}
     */
    getType(elem) {
        var _type = '';
        // type name
        if (elem instanceof type.UMLAssociationEnd) {
            if (elem.reference instanceof type.UMLModelElement && elem.reference.name.length > 0) {
                _type = elem.reference.name
            }
        } else {
            if (elem.type instanceof type.UMLModelElement && elem.type.name.length > 0) {
                _type = elem.type.name
            } else if ((typeof elem.type === 'string') && elem.type.length > 0) {
                _type = elem.type
            }
        }
        // multiplicity
        if (elem.multiplicity) {
            _type = 'array'
        }
        return _type
    }

    /**
     * Write Doc
     * @param {StringWriter} codeWriter
     * @param {string} text
     * @param {Object} options
     */
    writeDoc(codeWriter, text, options) {
        var i, len, lines;
        if (options.phpDoc && (typeof text === 'string')) {
            lines = text.trim().split('\n');

            var paramPrefix = '@param';
            var paramNodes = text.trim().split(' ');
            if (paramNodes.length > 0) {
                paramPrefix = paramNodes[0];
            }
            if (lines.length === 1 && paramPrefix === '@var') {
                codeWriter.writeLine('/** ' + lines[0] + ' */');
            } else {
                codeWriter.writeLine('/**');
                for (i = 0, len = lines.length; i < len; i++) {
                    console.log(lines[i]);
                    codeWriter.writeLine(' * ' + lines[i])
                }
                codeWriter.writeLine(' */')
            }
        }
    }

    /**
     * Write Package Declaration
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writePackageDeclaration(codeWriter, elem, options) {
        var packagePath = null;
        if (elem._parent) {
            packagePath = elem._parent.getPath(this.baseModel).map(function (e) {
                return e.name
            }).join('\\')
        }
        if (packagePath) {
            codeWriter.writeLine('namespace ' + packagePath + ';')
        }
    }

    /**
     * Write Constructor
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeConstructor(codeWriter, elem, options) {
        if (elem.name.length > 0) {
            var terms = [];
            // Doc
            this.writeDoc(codeWriter, 'Default constructor', options);
            // Visibility
            var visibility = this.getVisibility(elem);
            if (visibility) {
                terms.push(visibility)
            }
            terms.push('function __construct()');

            if (options.methodBracesOnNextLine === true) {
                codeWriter.writeLine(terms.join(' '));    
                codeWriter.writeLine('{');    
            } else {
                codeWriter.writeLine(terms.join(' ') + ' {');
            }
            codeWriter.indent();
            codeWriter.writeLine('// ...');
            codeWriter.outdent();
            codeWriter.writeLine('}')
        }
    }

    generateDocAttrArrayNotation(param, options) {

        // PHPStan & PSalm sintax
        if (options.useNonEmptyArrayNotation === true) {
            return '@var array<' + param.type + '> ' + param.documentation.trim();
        }

        // phpDocumentor sintax
        return '@var ' + param.type + '[] ' + param.documentation.trim();
    }
    
    generateDocParamArrayNotation(param, options) {

        // PHPStan & PSalm sintax
        if (options.useNonEmptyArrayNotation === true) {
            return '\n@param array<'+ param.type+'> $' + param.name + ' ' + param.documentation;
        }

        // phpDocumentor sintax
        return '\n@param '+ param.type + '[] $' + param.name + ' ' + param.documentation
    }

    generateDocReturnArrayNotation(param, options) {

        // PHPStan & PSalm sintax
        if (options.useNonEmptyArrayNotation === true) {
            return '\n@return array<'+ param.type+'> ' + param.documentation;
        }

        // phpDocumentor sintax
        return '\n@return '+ param.type+'[] ' + param.documentation;
    }

    /**
     * Write Member Variable
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeMemberVariable(codeWriter, elem, options) {
        if (elem.name.length > 0) {
            var terms = [];

            // doc
            var doc = '';
            if (elem.multiplicity && elem.type) {
                doc += this.generateDocAttrArrayNotation(elem, options);
            } else if(elem.type) {
                doc += '@var ' + elem.type + ' ' + elem.documentation.trim();
            }
            if (doc !== '') {
                this.writeDoc(codeWriter, doc, options);
            }

            // modifiers
            var _modifiers = this.getModifiers(elem);

            if (_modifiers.length > 0 && (!elem.isReadOnly || options.useStrictTypes === true)) {
                terms.push(_modifiers.join(' '))
            }

            if (elem.isReadOnly) {
                terms.push("const");
                terms.push(elem.name);
            } else if (options.useStrictTypes === true) {
                terms.push(this.getType(elem) + ' $' + elem.name);
            } else {
                terms.push('$' + elem.name);
            }
            // initial value
            if (elem.defaultValue && elem.defaultValue.length > 0) {
                terms.push('= ' + elem.defaultValue)
            }
            codeWriter.writeLine(terms.join(' ') + ';')
        }
    }

    /**
     * Write Method
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     * @param {boolean} skipBody
     * @param {boolean} skipParams
     */
    writeMethod(codeWriter, elem, options, skipBody, skipParams) {
        if (elem.name.length > 0) {
            var terms = [];
            var params = elem.getNonReturnParameters();
            var returnParam = elem.getReturnParameter();

            // doc
            var doc = elem.documentation.trim();

            // Erase PHPdoc @param and @return
            var i;
            var lines = doc.split('\n');
            doc = '';
            for (i = 0, len = lines.length; i < len; i++) {
                if (lines[i].lastIndexOf('@param', 0) !== 0 && lines[i].lastIndexOf('@return', 0) !== 0) {
                    doc += '\n' + lines[i]
                }
            }

            params.forEach(function (param) {
                if (param.multiplicity) {
                    doc += this.generateDocParamArrayNotation(param, options);
                } else {
                    doc += '\n@param '+ param.type+' $' + param.name + ' ' + param.documentation
                }
            }, this);
            if (returnParam && returnParam.multiplicity) {
                doc += this.generateDocReturnArrayNotation(returnParam, options);
            } else if (returnParam){
                doc += '\n@return ' + returnParam.type + ' ' + returnParam.documentation;
            }
            if (doc !== '') {
                this.writeDoc(codeWriter, doc, options);
            }

            // modifiers
            var _modifiers = this.getModifiers(elem);
            if (_modifiers.length > 0) {
                terms.push(_modifiers.join(' '))
            }

            terms.push('function');

            // name + parameters
            var paramTerms = [];
            if (!skipParams) {
                var len;
                for (i = 0, len = params.length; i < len; i++) {
                    var p = params[i];
                    var s = '$' + p.name;

                    if (p.defaultValue && p.defaultValue.length > 0) {
                        s = s + (' = ' + p.defaultValue)
                    }

                    if (options.useStrictTypes === true) {
                        s = p.type + ' ' + s; 
                    }
                    paramTerms.push(s)
                }
            }

            if (options.useStrictTypes === true && returnParam) {

                if (returnParam.multiplicity) {
                    terms.push(elem.name + '(' + paramTerms.join(', ') + '): array');
                } else if (returnParam){
                    terms.push(elem.name + '(' + paramTerms.join(', ') + '): ' + returnParam.type);
                }

            } else {
                terms.push(elem.name + '(' + paramTerms.join(', ') + ')');
            }

            // body
            if (skipBody === true || _modifiers.includes('abstract')) {
                codeWriter.writeLine(terms.join(' ') + ';')
            } else {

                if (options.methodBracesOnNextLine === true) {
                    codeWriter.writeLine(terms.join(' '));    
                    codeWriter.writeLine('{');    
                } else {
                    codeWriter.writeLine(terms.join(' ') + ' {');
                }

                codeWriter.indent();
                codeWriter.writeLine('// TODO implement here');

                // return statement
                if (returnParam) {
                    var returnType = this.getType(returnParam);

                    if (returnParam.multiplicity) {
                        returnType = 'array';
                    }

                    if (returnType === 'boolean' || returnType === 'bool') {
                        codeWriter.writeLine('return false;')
                    } else if (returnType === 'int' || returnType === 'long' || returnType === 'short' || returnType === 'byte') {
                        codeWriter.writeLine('return 0;')
                    } else if (returnType === 'float') {
                        codeWriter.writeLine('return 0.0;')
                    } else if (returnType === 'double') {
                        codeWriter.writeLine('return 0.0;')
                    } else if (returnType === 'char') {
                        codeWriter.writeLine('return "0";')
                    } else if (returnType === 'string') {
                        codeWriter.writeLine('return "";')
                    } else if (returnType === 'array') {
                        codeWriter.writeLine('return [];')
                    } else {
                        codeWriter.writeLine('return null;')
                    }
                }

                codeWriter.outdent();
                codeWriter.writeLine('}')
            }
        }
    }

    /**
     * Write Class
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeClass(codeWriter, elem, options) {
        var i, len;
        var terms = [];

        // Doc
        var doc = elem.documentation.trim();
        if (app.project.getProject().author && app.project.getProject().author.length > 0) {
            doc += '\n@author ' + app.project.getProject().author
        }

        if (doc !== '') {
            this.writeDoc(codeWriter, doc, options);
        }

        // Modifiers
        var _modifiers = this.getModifiers(elem);
        if (_modifiers.includes('abstract') !== true && elem.operations.some(function (op) {
            return op.isAbstract === true
        })) {
            _modifiers.push('abstract');
        }
        if (_modifiers.length > 0) {
            terms.push(_modifiers.join(' '))
        }

        // Class
        terms.push('class');
        terms.push(elem.name);

        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push('extends ' + _extends[0].name)
        }

        // Implements
        var _implements = this.getSuperInterfaces(elem);
        if (_implements.length > 0) {
            terms.push('implements ' + _implements.map(function (e) {
                return e.name
            }).join(', '))
        }

        if (options.classBracesOnNextLine === true) {
            codeWriter.writeLine(terms.join(' '));    
            codeWriter.writeLine('{');    
        } else {
            codeWriter.writeLine(terms.join(' ') + ' {');
        }
        codeWriter.writeLine();
        codeWriter.indent();


        // Member Variables
        // (from attributes)
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine()
        }
        // (from associations)
        var associations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation)
        });
        for (i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine()
            }
            if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine()
            }
        }

        var hasConstructor = false;
        for (i = 0, len = elem.operations.length; i < len; i++) {
            if (elem.operations[i].name === '__construct') {
                hasConstructor = true;
            }
        }
        
        // Constructor
        if (hasConstructor === false) {
            this.writeConstructor(codeWriter, elem, options);
            codeWriter.writeLine();
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, false, false);
            codeWriter.writeLine()
        }

        // Extends methods
        if (_extends.length > 0) {
            for (i = 0, len = _extends[0].operations.length; i < len; i++) {
                _modifiers = this.getModifiers(_extends[0].operations[i]);
                if (_modifiers.includes('abstract') === true) {
                    this.writeMethod(codeWriter, _extends[0].operations[i], options, false, false);
                    codeWriter.writeLine()
                }
            }
        }

        // Interface methods
        for (var j = 0; j < _implements.length; j++) {
            for (i = 0, len = _implements[j].operations.length; i < len; i++) {
                this.writeMethod(codeWriter, _implements[j].operations[i], options, false, false);
                codeWriter.writeLine()
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine('}');
        codeWriter.writeLine();

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === 'annotationType') {
                    this.writeAnnotationType(codeWriter, def, options)
                } else {
                    this.writeClass(codeWriter, def, options)
                }
                codeWriter.writeLine()
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine()
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine()
            }
        }


    }

    /**
     * Write Interface
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeInterface(codeWriter, elem, options) {
        var i, len;
        var terms = [];

        // Doc
        var doc = elem.documentation.trim();
        if (doc !== '') {
            this.writeDoc(codeWriter, elem.documentation, options);
        }

        // Interface
        terms.push('interface');
        terms.push(elem.name);

        // Extends
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            terms.push('extends ' + _extends.map(function (e) {
                return e.name
            }).join(', '))
        }
        if (options.classBracesOnNextLine === true) {
            codeWriter.writeLine(terms.join(' '));    
            codeWriter.writeLine('{');    
        } else {
            codeWriter.writeLine(terms.join(' ') + ' {');
        }
        codeWriter.writeLine();
        codeWriter.indent();

        // Member Variables
        // (from attributes)
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine()
        }
        // (from associations)
        var associations = app.repository.getRelationshipsOf(elem, function (rel) {
            return (rel instanceof type.UMLAssociation)
        });
        for (i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i];
            if (asso.end1.reference === elem && asso.end2.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end2, options);
                codeWriter.writeLine()
            }
            if (asso.end2.reference === elem && asso.end1.navigable === true) {
                this.writeMemberVariable(codeWriter, asso.end1, options);
                codeWriter.writeLine()
            }
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, true, false);
            codeWriter.writeLine()
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === 'annotationType') {
                    this.writeAnnotationType(codeWriter, def, options)
                } else {
                    this.writeClass(codeWriter, def, options)
                }
                codeWriter.writeLine()
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine()
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine()
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine('}')
    }

    /**
     * Write Enum
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeEnum(codeWriter, elem, options) {
        var i, len;
        var terms = [];

        // Doc
        var doc = elem.documentation.trim();
        if (doc !== '') {
            this.writeDoc(codeWriter, elem.documentation, options);
        }

        // Enum
        terms.push('class');
        terms.push(elem.name);

        if (options.classBracesOnNextLine === true) {
            codeWriter.writeLine(terms.join(' '));    
            codeWriter.writeLine('{');    
        } else {
            codeWriter.writeLine(terms.join(' ') + ' {');
        }

        codeWriter.indent();

        // Literals
        for (i = 0, len = elem.literals.length; i < len; i++) {
            codeWriter.writeLine("const " + elem.literals[i].name + " = " + i + ";")
        }

        codeWriter.outdent();
        codeWriter.writeLine('}')
    }

    /**
     * Write AnnotationType
     * @param {StringWriter} codeWriter
     * @param {type.Model} elem
     * @param {Object} options
     */
    writeAnnotationType(codeWriter, elem, options) {
        var i, len;
        var terms = [];

        // Doc
        var doc = elem.documentation.trim();
        if (app.project.getProject().author && app.project.getProject().author.length > 0) {
            doc += '\n@author ' + app.project.getProject().author
        }
        this.writeDoc(codeWriter, doc, options);

        // Modifiers
        var _modifiers = this.getModifiers(elem);
        if (_modifiers.includes('abstract') !== true && elem.operations.some(function (op) {
            return op.isAbstract === true
        })) {
            _modifiers.push('abstract')
        }
        if (_modifiers.length > 0) {
            terms.push(_modifiers.join(' '))
        }

        // AnnotationType
        terms.push('@interface');
        terms.push(elem.name);

        if (options.classBracesOnNextLine === true) {
            codeWriter.writeLine(terms.join(' '));    
            codeWriter.writeLine('{');    
        } else {
            codeWriter.writeLine(terms.join(' ') + ' {');
        }

        codeWriter.writeLine();
        codeWriter.indent();

        // Member Variables
        for (i = 0, len = elem.attributes.length; i < len; i++) {
            this.writeMemberVariable(codeWriter, elem.attributes[i], options);
            codeWriter.writeLine()
        }

        // Methods
        for (i = 0, len = elem.operations.length; i < len; i++) {
            this.writeMethod(codeWriter, elem.operations[i], options, true, true);
            codeWriter.writeLine()
        }

        // Extends methods
        var _extends = this.getSuperClasses(elem);
        if (_extends.length > 0) {
            for (i = 0, len = _extends[0].operations.length; i < len; i++) {
                _modifiers = this.getModifiers(_extends[0].operations[i]);
                if (_modifiers.includes('abstract') === true) {
                    this.writeMethod(codeWriter, _extends[0].operations[i], options, false, false);
                    codeWriter.writeLine()
                }
            }
        }

        // Inner Definitions
        for (i = 0, len = elem.ownedElements.length; i < len; i++) {
            var def = elem.ownedElements[i];
            if (def instanceof type.UMLClass) {
                if (def.stereotype === 'annotationType') {
                    this.writeAnnotationType(codeWriter, def, options)
                } else {
                    this.writeClass(codeWriter, def, options)
                }
                codeWriter.writeLine()
            } else if (def instanceof type.UMLInterface) {
                this.writeInterface(codeWriter, def, options);
                codeWriter.writeLine()
            } else if (def instanceof type.UMLEnumeration) {
                this.writeEnum(codeWriter, def, options);
                codeWriter.writeLine()
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine('}')
    }
}

/**
 * Generate
 * @param {type.Model} baseModel
 * @param {string} basePath
 * @param {Object} options
 */
function generate(baseModel, basePath, options) {
    var phpCodeGenerator = new PHPCodeGenerator(baseModel, basePath);
    phpCodeGenerator.generate(baseModel, basePath, options)
}

exports.generate = generate;
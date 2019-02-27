PHP Extension for StarUML
==========================

This extension for StarUML(http://staruml.io) support to generate PHP code from UML model. Install this extension from Extension Manager of StarUML.

Based on https://github.com/staruml/staruml-java

PHP Code Generation
--------------------

1. Click the menu (`Tools > PHP > Generate Code...`)
2. Select a base model (or package) that will be generated to PHP.
3. Select a folder where generated PHP source files will be placed.

Belows are the rules to convert from UML model elements to PHP source codes.

### UMLPackage

* converted to _PHP Namespace_ (as a folder).

### UMLClass

* converted to _PHP Class_. (as a separate `.php` file)
* `visibility` to one of modifiers `public`, `protected`, `private` and none.
* `isAbstract` property to `abstract` modifier.
* Default constructor is generated.
* All contained types (_UMLClass_, _UMLInterface_, _UMLEnumeration_) are generated as inner type definition.
* Documentation property to PHPDoc comment.

### UMLAttribute

* converted to _PHP Field_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to field identifier.
* `multiplicity` property to array type.
* `isStatic` property to `static` modifier.
* `defaultValue` property to initial value.
* Documentation property to PHPDoc comment.

### UMLOperation

* converted to _PHP Methods_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to method identifier.
* `isAbstract` property to `abstract` modifier.
* `isStatic` property to `static` modifier.
* _UMLParameter_ to _PHP Method Parameters_.
* _UMLParameter_'s name property to parameter identifier.
* Documentation property to PHPDoc comment.

### UMLInterface

* converted to _PHP Interface_.  (as a separate `.php` file)
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* Documentation property to PHPDoc comment.

### UMLEnumeration

* converted to _PHP Enum_.  (as a separate `.php` file)
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* _UMLEnumerationLiteral_ to literals of enum.

### UMLAssociationEnd

* converted to _PHP Field_.
* `visibility` property to one of modifiers `public`, `protected`, `private` and none.
* `name` property to field identifier.
* `defaultValue` property to initial value.
* Documentation property to PHPDoc comment.

### UMLGeneralization

* converted to _PHP Extends_ (`extends`).
* Allowed only for _UMLClass_ to _UMLClass_, and _UMLInterface_ to _UMLInterface_.

### UMLInterfaceRealization

* converted to _PHP Implements_ (`implements`).
* Allowed only for _UMLClass_ to _UMLInterface_.

---

Licensed under the MIT license (see LICENSE file).

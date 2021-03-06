import {Component, OnInit} from "@angular/core";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {ArticleService} from "../../../services/article.service";
import {Article} from "../../../entities/Article";
import {Image} from "../../../entities/Image";
import {ImageService} from "../../../services/image.service";

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {

  articleForm: FormGroup;
  private image: Image = new Image();
  detailLink: string = "";

  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute, private articleService: ArticleService, private imageService: ImageService) {

  }

  ngOnInit() {

    this.articleForm = this.fb.group({
      'name': new FormControl('', [Validators.required, Validators.maxLength(25)]),
      'description': new FormControl('', Validators.required),
      'price': new FormControl('', Validators.required),
      'promotionPrice': new FormControl(''),
      'image': new FormControl('')
    });

    this.route.params.subscribe(
      (params) => {
        this.detailLink = params.detailLink;

        // Wenn ein Artikel bearbeitet werden soll, diesen laden
        if (this.detailLink != null) {

          this.articleService.loadArticle(this.detailLink).subscribe(
            (article) => {
              this.articleForm.setValue({
                "name": article.name,
                "description": article.description,
                "price": article.price,
                "promotionPrice": article.promotionPrice,
                "image": ""
              });
            },
            (error) => {
              console.log(error);
            }
          );

        }
      },
      (error) => {
        console.error(error);
      }
    );

  }

  convertImageToBase64(event) {
    let files = event.target.files;
    let file = files[0];

    if (files && file) {
      let reader = new FileReader();
      reader.onload = this.handleReaderLoaded.bind(this);
      reader.readAsBinaryString(file);
    }
  }

  cancelEdit() {
    this.router.navigate(['admin']);
  }

  saveArticle() {
    let article: Article = this.mapFormGroupToInternalModel();

    if (article.detailLink) {
      if (this.image.content) {
        this.updateImageAndArticle(article);
      } else {
        this.updateArticle(article);
      }
    } else {
      this.createNewImageAndArticle(article);
    }
  }

  private updateImageAndArticle(article: Article) {
    this.imageService.createImage(article.image)
      .map(response => response.json())
      .subscribe(
        (response) => {
          article.image = response._links.self.href;

          this.updateArticle(article);
        },
        (error) => {
          console.error("Creating Image failed");
          console.error(error);
        }
      );
  }

  private createNewImageAndArticle(article: Article) {
    this.imageService.createImage(article.image)
      .map(response => response.json())
      .subscribe(
        (response) => {
          article.image = response._links.self.href;

          this.createArticle(article);
        },
        (error) => {
          console.error("Creating Image failed");
          console.error(error);
        }
      );
  }

  private mapFormGroupToInternalModel(): Article {
    let article: Article = new Article();

    article.name = this.articleForm.get('name').value;
    article.description = this.articleForm.get('description').value;
    article.price = this.articleForm.get('price').value;
    article.promotionPrice = this.articleForm.get('promotionPrice').value;
    article.image = this.image.content;
    article.detailLink = this.detailLink;

    return article;
  }

  private handleReaderLoaded(readerEvt) {
    let binaryString = readerEvt.target.result;
    this.image.content = btoa(binaryString);
  }

  private createArticle(article: Article) {
    this.articleService.createArticle(article).subscribe(
      (resp) => {
        this.router.navigate(["admin/"]);
      },
      (err) => {
        console.error("Creation of article failed");
        console.error(err);
      }
    );
  }

  private updateArticle(pArticle: Article) {
    this.articleService.updateArticle(pArticle).subscribe(
      (resp) => {
        this.router.navigate(["admin/"]);
      },
      (err) => {
        console.error("Update of article failed");
        console.error(err);
      }
    );
  }
}
